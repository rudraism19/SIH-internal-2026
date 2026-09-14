from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


VALID_INGESTION_STATUSES = {
    "pending",
    "downloading",
    "downloaded",
    "processing",
    "chunked",
    "embedded",
    "indexed",
    "failed",
}


class DocumentBase(BaseModel):
    standard_number: Optional[str] = Field(
        None,
        description="Official BIS Indian Standard code (e.g. 'IS 1460:2017'). null if unconfirmed or compendium.",
        examples=["IS 1460:2017"],
    )
    title: Optional[str] = Field(
        None,
        description="Standard or publication title",
        examples=["Automotive Diesel Fuel — Specification"],
    )
    product: Optional[str] = Field(
        None,
        description="Associated product name",
        examples=["Automotive Diesel"],
    )
    document_type: str = Field(
        default="Indian Standard",
        description="Document category (e.g. 'Indian Standard', 'Special Publication', 'Code of Practice')",
        examples=["Indian Standard"],
    )
    version: Optional[str] = Field(
        None,
        description="Standard revision or reaffirmation year (e.g. '2017')",
        examples=["2017"],
    )
    status: str = Field(
        default="Published",
        description="Standard lifecycle status (e.g. 'Published', 'Under Revision', 'Withdrawn')",
        examples=["Published"],
    )
    source_url: Optional[str] = Field(
        None,
        description="URL to official BIS portal or publication repository",
        examples=["https://www.services.bis.gov.in"],
    )
    file_path: Optional[str] = Field(
        None,
        description="Relative or local path to the raw PDF file",
        examples=["knowledge_base/raw/IS-1460-2017.pdf"],
    )
    file_checksum: Optional[str] = Field(
        None,
        description="SHA-256 hash of the PDF file for duplicate detection and tamper verification",
        examples=["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Arbitrary additional JSON metadata",
    )


class DocumentCreate(DocumentBase):
    ingestion_status: str = Field(
        default="pending",
        description="Initial ingestion pipeline state",
        examples=["pending"],
    )

    @field_validator("ingestion_status")
    @classmethod
    def validate_ingestion_status(cls, v: str) -> str:
        if v not in VALID_INGESTION_STATUSES:
            raise ValueError(
                f"Invalid ingestion_status: '{v}'. Must be one of: {', '.join(sorted(VALID_INGESTION_STATUSES))}"
            )
        return v


class DocumentUpdateStatus(BaseModel):
    ingestion_status: str = Field(
        ...,
        description="Updated ingestion pipeline state",
        examples=["downloaded"],
    )

    @field_validator("ingestion_status")
    @classmethod
    def validate_ingestion_status(cls, v: str) -> str:
        if v not in VALID_INGESTION_STATUSES:
            raise ValueError(
                f"Invalid ingestion_status: '{v}'. Must be one of: {', '.join(sorted(VALID_INGESTION_STATUSES))}"
            )
        return v


class DocumentRecord(DocumentBase):
    id: str = Field(..., description="Unique UUID identifier for the document")
    ingestion_status: str = Field(default="pending", description="Ingestion pipeline state")
    created_at: Optional[str] = Field(None, description="ISO timestamp of creation in UTC")
    updated_at: Optional[str] = Field(None, description="ISO timestamp of last modification in UTC")


class DocumentResponse(BaseModel):
    success: bool = Field(default=True, description="API status flag")
    document: DocumentRecord = Field(..., description="Document catalogue record")
    message: Optional[str] = Field(None, description="Informational message")


class DocumentListResponse(BaseModel):
    success: bool = Field(default=True, description="API status flag")
    count: int = Field(..., description="Number of documents returned in this page")
    total: Optional[int] = Field(None, description="Total number of matching documents")
    documents: List[DocumentRecord] = Field(default_factory=list, description="List of catalogue document records")


class DocumentDeleteResponse(BaseModel):
    success: bool = Field(default=True, description="API status flag")
    id: str = Field(..., description="Identifier of deleted document")
    message: str = Field(default="Document successfully deleted from catalogue")


class IngestionResultItem(BaseModel):
    document_id: str = Field(..., description="Document UUID")
    standard_number: Optional[str] = Field(None, description="Confirmed BIS Indian Standard number")
    title: Optional[str] = Field(None, description="Document title")
    status: str = Field(..., description="Final status of ingestion (e.g. 'indexed', 'failed')")
    pages_count: Optional[int] = Field(None, description="Number of pages extracted")
    chunks_count: Optional[int] = Field(None, description="Number of chunks created and embedded")
    error: Optional[str] = Field(None, description="Error detail if failed")


class IngestionResponse(BaseModel):
    success: bool = Field(default=True, description="API status flag")
    document_id: str = Field(..., description="ID of catalogued document")
    status: str = Field(..., description="Final or current ingestion status (e.g. 'indexed', 'failed')")
    pages_count: Optional[int] = Field(None, description="Number of extracted pages")
    chunks_count: Optional[int] = Field(None, description="Number of generated & stored chunks")
    message: str = Field(..., description="Status description message")
    error: Optional[str] = Field(None, description="Error message if ingestion failed")


class IngestAllResponse(BaseModel):
    success: bool = Field(default=True, description="API status flag")
    total_processed: int = Field(..., description="Total documents processed in batch")
    indexed_count: int = Field(..., description="Count of successfully indexed documents")
    failed_count: int = Field(..., description="Count of failed documents")
    results: List[IngestionResultItem] = Field(default_factory=list, description="Individual ingestion summaries")
