import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.document import (
    DocumentCreate,
    DocumentUpdateStatus,
    DocumentResponse,
    DocumentListResponse,
    DocumentDeleteResponse,
    IngestionResponse,
    IngestAllResponse,
)
from app.services.catalogue_service import catalogue_service
from app.services.ingestion_service import ingestion_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Catalogue a BIS Document",
    description="Adds a new Indian Standard or BIS publication to the document catalogue with duplicate prevention.",
)
async def create_document(doc_data: DocumentCreate):
    try:
        doc = catalogue_service.create_document(doc_data)
        return DocumentResponse(
            success=True,
            document=doc,
            message="Document catalogued successfully",
        )
    except Exception as e:
        logger.error(f"Failed to catalogue document: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to catalogue document: {str(e)}",
        )


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List Catalogued BIS Documents",
    description="Returns a paginated list of catalogued BIS documents with optional filtering by type, ingestion status, or standard number.",
)
async def list_documents(
    limit: int = Query(50, ge=1, le=100, description="Max documents to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    document_type: Optional[str] = Query(None, description="Filter by document type (e.g. 'Indian Standard')"),
    ingestion_status: Optional[str] = Query(None, description="Filter by ingestion pipeline state (e.g. 'pending')"),
    standard_number: Optional[str] = Query(None, description="Search by Indian Standard number substring"),
):
    try:
        if standard_number:
            docs = catalogue_service.find_document_by_standard_number(standard_number)
            return DocumentListResponse(
                success=True,
                count=len(docs),
                total=len(docs),
                documents=docs,
            )

        docs, total = catalogue_service.list_documents(
            limit=limit,
            offset=offset,
            document_type=document_type,
            ingestion_status=ingestion_status,
        )
        return DocumentListResponse(
            success=True,
            count=len(docs),
            total=total,
            documents=docs,
        )
    except Exception as e:
        logger.error(f"Failed to list documents: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}",
        )


@router.post(
    "/ingest-all-pending",
    response_model=IngestAllResponse,
    summary="Batch Ingest All Pending Documents",
    description="Finds all catalogue documents currently in 'pending' status and executes the ingestion and vectorization pipeline.",
)
async def ingest_all_pending():
    try:
        res = ingestion_service.ingest_all_pending()
        return IngestAllResponse(
            success=True,
            total_processed=res["total_processed"],
            indexed_count=res["indexed_count"],
            failed_count=res["failed_count"],
            results=res["results"],
        )
    except Exception as e:
        logger.error(f"Failed to batch ingest pending documents: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch ingestion failed: {str(e)}",
        )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get Document by ID",
    description="Retrieves a specific BIS document catalogue record by its UUID.",
)
async def get_document(document_id: str):
    doc = catalogue_service.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found in catalogue.",
        )
    return DocumentResponse(success=True, document=doc)


@router.post(
    "/{document_id}/ingest",
    response_model=IngestionResponse,
    summary="Trigger Vector Ingestion Pipeline",
    description="Loads the raw PDF for this document, generates clause-aware chunks, embeds them into vectors, and indexes them in Supabase.",
)
async def trigger_document_ingestion(document_id: str):
    doc = catalogue_service.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found in catalogue.",
        )

    try:
        res = ingestion_service.ingest_document(document_id)
        return IngestionResponse(
            success=True,
            document_id=document_id,
            status=res["status"],
            pages_count=res.get("pages_count"),
            chunks_count=res.get("chunks_count"),
            message="Document ingestion, chunking, and embedding completed successfully.",
        )
    except FileNotFoundError as fnf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Source PDF file is missing: {str(fnf)}",
        )
    except Exception as e:
        logger.error(f"Ingestion failed for document {document_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion pipeline failed: {str(e)}",
        )


@router.patch(
    "/{document_id}/status",
    response_model=DocumentResponse,
    summary="Update Ingestion Status",
    description="Updates the ingestion lifecycle status of a document (e.g., 'downloaded', 'processing', 'chunked', 'indexed').",
)
async def update_document_status(document_id: str, payload: DocumentUpdateStatus):
    try:
        updated = catalogue_service.update_document_status(document_id, payload.ingestion_status)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID '{document_id}' not found in catalogue.",
            )
        return DocumentResponse(
            success=True,
            document=updated,
            message=f"Ingestion status updated to '{payload.ingestion_status}'",
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update document status: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update document status: {str(e)}",
        )


@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
    summary="Delete Document from Catalogue",
    description="Removes a document record from the catalogue by UUID.",
)
async def delete_document(document_id: str):
    deleted = catalogue_service.delete_document(document_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found in catalogue.",
        )
    return DocumentDeleteResponse(
        success=True,
        id=document_id,
        message="Document successfully deleted from catalogue",
    )
