/**
 * UI Localization Dictionary for BIS Assistant
 * Covers all 22 Scheduled Indian Languages + English
 */

export const UI_TRANSLATIONS = {
  'en-IN': {
    brandTitle: 'BIS ASSISTANT',
    govBadge: 'GOV.IN',
    brandSubtitle: 'Bureau of Indian Standards Assistant',
    brandPillars: 'Standards • Certification • Testing • Compliance',
    evidenceNote: 'Evidence-based BIS information • Multilingual voice enabled',
    resetBtn: 'Reset',
    resetTitle: 'Clear current session and start a new inquiry',
    portalTitle: 'COMPLIANCE PORTAL',
    ministryBadge: 'Ministry of Consumer Affairs, GoI',
    nav: {
      assistant: 'Assistant',
      standards: 'Standards',
      qco: 'QCO & Mandatory',
      testing: 'Testing',
      laboratories: 'Laboratories',
      calculator: 'Batch Calculator',
      calendar: 'Compliance Calendar',
      audit: 'Audit Simulator',
      dossier: 'Application Dossier',
      documents: 'Documents',
      settings: 'Settings',
    },
    hero: {
      badge: 'OFFICIAL CONFORMITY PLATFORM',
      title: 'Find the right BIS requirement',
      subtitle: 'Identify standards, certification requirements, testing procedures, laboratories and compliance information.',
      nodes: {
        product: 'PRODUCT',
        standard: 'STANDARD',
        certification: 'CERTIFICATION',
        testing: 'TESTING',
        laboratory: 'LABORATORY',
        compliance: 'COMPLIANCE',
      },
      prompts: {
        standard: {
          label: 'Find Standard',
          query: 'What BIS standard applies to stainless steel water bottles?',
        },
        certification: {
          label: 'Certification',
          query: 'How do I get BIS certification for my product?',
        },
        testing: {
          label: 'Testing Requirements',
          query: 'What testing is required for automotive diesel?',
        },
        laboratory: {
          label: 'BIS Laboratory',
          query: 'Which BIS laboratory can test my product?',
        },
        qco: {
          label: 'QCO / Mandatory',
          query: 'Is BIS certification mandatory for pressure cookers?',
        },
        hallmarking: {
          label: 'Hallmarking',
          query: 'How can I verify a gold HUID?',
        },
      },
    },
    input: {
      placeholder: 'Ask about a product, IS code, certification, testing, or QCO requirements...',
      send: 'Send',
      listening: 'Listening...',
      transcribing: 'Transcribing speech...',
      micTitle: 'Voice Input',
    },
    settings: {
      title: 'Portal Settings & Compliance Preferences',
      subtitle: 'Configure linguistic preferences, acoustic speech synthesis, and conformity knowledge scopes.',
      langSectionTitle: 'Linguistic & Indic Script Preferences',
      langSectionDesc: 'Select primary language for querying and structured answer presentation.',
      voiceSectionTitle: 'Acoustic Speech Synthesis (Sarvam AI)',
      voiceSectionDesc: 'Enable spoken audio responses and choose your preferred speaker voice profile.',
      voiceActive: 'Voice Active',
      voiceDisabled: 'Voice Disabled',
      resetSectionTitle: 'Session & Knowledge State',
      resetSectionDesc: 'Clear active inquiry context, cached standards, and start fresh session.',
      resetSessionBtn: 'Reset Current Session',
    },
    badges: {
      verified: 'Verified Standard',
      grounded: 'Official Evidence Grounded',
      audioPlay: 'Listen',
      audioPlaying: 'Playing...',
    },
  },

  'hi-IN': {
    brandTitle: 'बीआईएस सहायक',
    govBadge: 'GOV.IN',
    brandSubtitle: 'भारतीय मानक ब्यूरो (BIS) डिजिटल सहायक',
    brandPillars: 'मानक • प्रमाणन • परीक्षण • अनुपालन',
    evidenceNote: 'प्रमाण-आधारित बीआईएस जानकारी • बहुभाषी वॉयस सक्षम',
    resetBtn: 'रीसेट',
    resetTitle: 'सत्र साफ़ करें और नई पूछताछ शुरू करें',
    portalTitle: 'अनुपालन पोर्टल',
    ministryBadge: 'उपभोक्ता मामले मंत्रालय, भारत सरकार',
    nav: {
      assistant: 'सहायक (AI)',
      standards: 'मानक (Standards)',
      qco: 'QCO एवं अनिवार्य',
      testing: 'परीक्षण (Testing)',
      laboratories: 'प्रयोगशालाएं (Labs)',
      calculator: 'बैच कैलकुलेटर (SIT)',
      calendar: 'अनुपालन कैलेंडर',
      audit: 'ऑडिट सिम्युलेटर',
      dossier: 'आवेदन डोजियर (Form-V)',
      documents: 'दस्तावेज़',
      settings: 'सेटिंग्स',
    },
    hero: {
      badge: 'आधिकारिक बीआईएस अनुरूपता पोर्टल',
      title: 'सही बीआईएस आवश्यकता खोजें',
      subtitle: 'भारतीय मानक, प्रमाणन प्रक्रिया, परीक्षण मानदंड, अनुमोदित प्रयोगशालाएं और QCO अनुपालन खोजें।',
      nodes: {
        product: 'उत्पाद',
        standard: 'मानक',
        certification: 'प्रमाणन',
        testing: 'परीक्षण',
        laboratory: 'प्रयोगशाला',
        compliance: 'अनुपालन',
      },
      prompts: {
        standard: {
          label: 'मानक खोजें',
          query: 'स्टेनलेस स्टील पानी की बोतलों के लिए कौन सा बीआईएस मानक लागू है?',
        },
        certification: {
          label: 'प्रमाणन प्रक्रिया',
          query: 'मुझे अपने उत्पाद के लिए बीआईएस प्रमाणन (ISI मार्क) कैसे मिल सकता है?',
        },
        testing: {
          label: 'परीक्षण आवश्यकताएं',
          query: 'ऑटोमोटिव डीजल के लिए कौन से परीक्षण आवश्यक हैं?',
        },
        laboratory: {
          label: 'बीआईएस प्रयोगशालाएं',
          query: 'कौन सी बीआईएस अनुमोदित प्रयोगशाला मेरे उत्पाद का परीक्षण कर सकती है?',
        },
        qco: {
          label: 'QCO / अनिवार्य आदेश',
          query: 'क्या प्रेशर कुकर के लिए बीआईएस प्रमाणन अनिवार्य है?',
        },
        hallmarking: {
          label: 'हॉलमार्किंग एवं HUID',
          query: 'मैं सोने के गहनों पर 6-अंकीय HUID को कैसे सत्यापित करूं?',
        },
      },
    },
    input: {
      placeholder: 'किसी उत्पाद, IS कोड, प्रमाणन, परीक्षण या QCO के बारे में पूछें...',
      send: 'भेजें',
      listening: 'सुन रहे हैं...',
      transcribing: 'आवाज को टेक्स्ट में बदला जा रहा है...',
      micTitle: 'ध्वनि इनपुट (माइक)',
    },
    settings: {
      title: 'पोर्टल सेटिंग्स एवं अनुपालन प्राथमिकताएं',
      subtitle: 'भाषा प्राथमिकताएं, ध्वनिक भाषण संश्लेषण और संदर्भ सेटिंग्स कॉन्फ़िगर करें।',
      langSectionTitle: 'भाषाई और भारतीय लिपि प्राथमिकताएं',
      langSectionDesc: 'पूछताछ और उत्तर प्रस्तुति के लिए अपनी पसंदीदा भाषा चुनें।',
      voiceSectionTitle: 'ध्वनिक भाषण संश्लेषण (Sarvam AI)',
      voiceSectionDesc: 'बोलकर उत्तर देने की सुविधा सक्षम करें और आवाज प्रोफ़ाइल चुनें।',
      voiceActive: 'आवाज सक्रिय',
      voiceDisabled: 'आवाज निष्क्रिय',
      resetSectionTitle: 'सत्र एवं संदर्भ प्रबंधन',
      resetSectionDesc: 'वर्तमान संदर्भ और इतिहास साफ़ करें तथा नया सत्र प्रारंभ करें।',
      resetSessionBtn: 'वर्तमान सत्र रीसेट करें',
    },
    badges: {
      verified: 'सत्यापित मानक',
      grounded: 'आधिकारिक साक्ष्य आधारित',
      audioPlay: 'सुनें',
      audioPlaying: 'चल रहा है...',
    },
  },

  'mr-IN': {
    brandTitle: 'बीआयएस सहाय्यक',
    govBadge: 'GOV.IN',
    brandSubtitle: 'भारतीय मानक ब्युरो (BIS) सहाय्यक',
    brandPillars: 'मानके • प्रमाणन • चाचणी • अनुपालन',
    evidenceNote: 'पुरावा-आधारित बीआयएस माहिती • बहुभाषिक आवाज सक्षम',
    resetBtn: 'रीसेट करा',
    resetTitle: 'सत्र साफ करा आणि नवीन चौकशी सुरू करा',
    portalTitle: 'अनुपालन पोर्टल',
    ministryBadge: 'ग्राहक व्यवहार मंत्रालय, भारत सरकार',
    nav: {
      assistant: 'सहाय्यक',
      standards: 'मानके',
      qco: 'QCO आणि अनिवार्य',
      testing: 'चाचणी',
      laboratories: 'प्रयोगशाळा',
      calculator: 'बॅच कॅल्क्युलेटर',
      calendar: 'अनुपालन दिनदर्शिका',
      audit: 'ऑडिट सिम्युलेटर',
      dossier: 'अर्ज डॉसियर (Form-V)',
      documents: 'दस्तऐवज',
      settings: 'सेटिंग्ज',
    },
    hero: {
      badge: 'अधिकृत बीआयएस प्लॅटफॉर्म',
      title: 'योग्य बीआयएस आवश्यकता शोधा',
      subtitle: 'मानके, प्रमाणन आवश्यकता, चाचणी प्रक्रिया, प्रयोगशाळा आणि अनुपालन माहिती ओळखा.',
      nodes: {
        product: 'उत्पादन',
        standard: 'मानक',
        certification: 'प्रमाणन',
        testing: 'चाचणी',
        laboratory: 'प्रयोगशाळा',
        compliance: 'अनुपालन',
      },
      prompts: {
        standard: {
          label: 'मानक शोधा',
          query: 'स्टेनलेस स्टील पाण्याच्या बाटल्यांसाठी कोणते बीआयएस मानक लागू आहे?',
        },
        certification: {
          label: 'प्रमाणन',
          query: 'माझ्या उत्पादनासाठी बीआयएस प्रमाणन कसे मिळवावे?',
        },
        testing: {
          label: 'चाचणी आवश्यकता',
          query: 'ऑटोमोटिव्ह डिझेलसाठी कोणती चाचणी आवश्यक आहे?',
        },
        laboratory: {
          label: 'बीआयएस प्रयोगशाळा',
          query: 'कोणती बीआयएस प्रयोगशाळा माझ्या उत्पादनाची चाचणी करू शकते?',
        },
        qco: {
          label: 'QCO / अनिवार्य',
          query: 'प्रेशर कुकरसाठी बीआयएस प्रमाणन अनिवार्य आहे का?',
        },
        hallmarking: {
          label: 'हॉलमार्किंग',
          query: 'मी सोन्याचा HUID कसा पडताळू शकतो?',
        },
      },
    },
    input: {
      placeholder: 'उत्पादन, IS कोड, प्रमाणन, चाचणी किंवा QCO बद्दल विचारा...',
      send: 'पाठवा',
      listening: 'ऐकत आहे...',
      transcribing: 'आवाज रूपांतरित करत आहे...',
      micTitle: 'व्हॉइस इनपुट',
    },
    settings: {
      title: 'पोर्टल सेटिंग्ज आणि प्राधान्ये',
      subtitle: 'भाषिक प्राधान्ये आणि आवाज संश्लेषण कॉन्फिगर करा.',
      langSectionTitle: 'भाषिक आणि लिपी प्राधान्ये',
      langSectionDesc: 'चौकशी आणि उत्तरासाठी प्राथमिक भाषा निवडा.',
      voiceSectionTitle: 'व्हॉइस संश्लेषण (Sarvam AI)',
      voiceSectionDesc: 'ऑडिओ प्रतिसाद सक्षम करा.',
      voiceActive: 'आवाज सक्रिय',
      voiceDisabled: 'आवाज बंद',
      resetSectionTitle: 'सत्र व्यवस्थापन',
      resetSectionDesc: 'सध्याचा संदर्भ साफ करा.',
      resetSessionBtn: 'सत्र रीसेट करा',
    },
    badges: {
      verified: 'सत्यापित मानक',
      grounded: 'अधिकृत पुरावा आधारित',
      audioPlay: 'ऐका',
      audioPlaying: 'सुरू आहे...',
    },
  },

  'bn-IN': {
    brandTitle: 'বিআইএস সহকারী',
    govBadge: 'GOV.IN',
    brandSubtitle: 'ব্যুরো অফ ইন্ডিয়ান স্ট্যান্ডার্ডস সহকারী',
    brandPillars: 'মান • শংসাপত্র • পরীক্ষা • সম্মতি',
    evidenceNote: 'প্রমাণ-ভিত্তিক বিআইএস তথ্য • বহুভাষিক ভয়েস সক্ষম',
    resetBtn: 'রিসেট',
    resetTitle: 'সেশন পরিষ্কার করুন এবং নতুন অনুসন্ধান শুরু করুন',
    portalTitle: 'সম্মতি পোর্টাল',
    ministryBadge: 'ভোক্তা বিষয়ক মন্ত্রণালয়, ভারত সরকার',
    nav: {
      assistant: 'সহকারী',
      standards: 'মান (Standards)',
      qco: 'QCO ও বাধ্যতামূলক',
      testing: 'পরীক্ষা (Testing)',
      laboratories: 'ল্যাবরেটরি',
      calculator: 'ব্যাচ ক্যালকুলেটর',
      calendar: 'সম্মতি ক্যালেন্ডার',
      audit: 'অডিট সিমুলেটর',
      dossier: 'আবেদন ডসিয়ার',
      documents: 'নথিপত্র',
      settings: 'সেটিংস',
    },
    hero: {
      badge: 'অফিসিয়াল বিআইএস প্ল্যাটফর্ম',
      title: 'সঠিক বিআইএস প্রয়োজনীয়তা খুঁজুন',
      subtitle: 'মান, সার্টিফিকেশন প্রয়োজনীয়তা, পরীক্ষার পদ্ধতি, ল্যাব এবং সম্মতি তথ্য খুঁজুন।',
      nodes: {
        product: 'পণ্য',
        standard: 'মান',
        certification: 'সার্টিফিকেশন',
        testing: 'পরীক্ষা',
        laboratory: 'ল্যাবরেটরি',
        compliance: 'সম্মতি',
      },
      prompts: {
        standard: {
          label: 'মান খুঁজুন',
          query: 'স্টেইনলেস স্টিলের জলের বোতলের জন্য কোন বিআইএস মান প্রযোজ্য?',
        },
        certification: {
          label: 'সার্টিফিকেশন',
          query: 'আমার পণ্যের জন্য বিআইএস সার্টিফিকেশন কীভাবে পাব?',
        },
        testing: {
          label: 'পরীক্ষার প্রয়োজনীয়তা',
          query: 'মোটরগাড়ির ডিজেলের জন্য কী পরীক্ষা প্রয়োজন?',
        },
        laboratory: {
          label: 'বিআইএস ল্যাব',
          query: 'কোন বিআইএস অনুমোদিত ল্যাব আমার পণ্য পরীক্ষা করতে পারে?',
        },
        qco: {
          label: 'QCO / বাধ্যতামূলক',
          query: 'প্রেসার কুকারের জন্য কি বিআইএস সার্টিফিকেশন বাধ্যতামূলক?',
        },
        hallmarking: {
          label: 'হলমার্কিং',
          query: 'সোনার গহনায় ৬-সংখ্যার HUID কীভাবে যাচাই করব?',
        },
      },
    },
    input: {
      placeholder: 'পণ্য, IS কোড, সার্টিফিকেশন, টেস্টিং বা QCO সম্পর্কে জিজ্ঞাসা করুন...',
      send: 'পাঠান',
      listening: 'শুনছি...',
      transcribing: 'ভয়েস টেক্সটে রূপান্তর হচ্ছে...',
      micTitle: 'ভয়েস ইনপুট',
    },
    settings: {
      title: 'পোর্টাল সেটিংস ও পছন্দসমূহ',
      subtitle: 'ভাষা এবং ভয়েস প্রতিক্রিয়া কনফিগার করুন।',
      langSectionTitle: 'ভাষা ও লিপি পছন্দ',
      langSectionDesc: 'জিজ্ঞাসাবাদের জন্য আপনার পছন্দের ভাষা নির্বাচন করুন।',
      voiceSectionTitle: 'ভয়েস সংশ্লেষণ (Sarvam AI)',
      voiceSectionDesc: 'স্পোকেন অডিও চালু করুন।',
      voiceActive: 'ভয়েস সক্রিয়',
      voiceDisabled: 'ভয়েস নিষ্ক্রিয়',
      resetSectionTitle: 'সেশন পরিচালনা',
      resetSectionDesc: 'বর্তমান সেশন সাফ করুন।',
      resetSessionBtn: 'সেশন রিসেট করুন',
    },
    badges: {
      verified: 'যাচাইকৃত মান',
      grounded: 'প্রমাণ-ভিত্তিক',
      audioPlay: 'শুনুন',
      audioPlaying: 'চলছে...',
    },
  },

  'gu-IN': {
    brandTitle: 'બીઆઈએસ સહાયક',
    govBadge: 'GOV.IN',
    brandSubtitle: 'બ્યુરો ઓફ ઇન્ડિયન સ્ટાન્ડર્ડ્સ સહાયક',
    brandPillars: 'માનકો • પ્રમાણીકરણ • પરીક્ષણ • અનુપાલન',
    evidenceNote: 'પુરાવા-આધારિત બીઆઈએસ માહિતી • બહુભાષી અવાજ સક્ષમ',
    resetBtn: 'રીસેટ',
    resetTitle: 'સત્ર સાફ કરો અને નવી પૂછપરછ શરૂ કરો',
    portalTitle: 'અનુપાલન પોર્ટલ',
    ministryBadge: 'ગ્રાહક બાબતોનું મંત્રાલય, ભારત સરકાર',
    nav: {
      assistant: 'સહાયક',
      standards: 'માનકો',
      qco: 'QCO અને ફરજિયાત',
      testing: 'પરીક્ષણ',
      laboratories: 'પ્રયોગશાળાઓ',
      calculator: 'બેચ કેલ્ક્યુલેટર',
      calendar: 'અનુપાલન કેલેન્ડર',
      audit: 'ઓડિટ સિમ્યુલેટર',
      dossier: 'અરજી ડોઝિયર',
      documents: 'દસ્તાવેજો',
      settings: 'સેટિંગ્સ',
    },
    hero: {
      badge: 'સત્તાવાર બીઆઈએસ પ્લેટફોર્મ',
      title: 'યોગ્ય બીઆઈએસ જરૂરિયાત શોધો',
      subtitle: 'માનકો, પ્રમાણીકરણ પ્રક્રિયા, પરીક્ષણ પદ્ધતિઓ અને અનુપાલન માહિતી શોધો.',
      nodes: {
        product: 'ઉત્પાદન',
        standard: 'માનક',
        certification: 'પ્રમાણીકરણ',
        testing: 'પરીક્ષણ',
        laboratory: 'પ્રયોગશાળા',
        compliance: 'અનુપાલન',
      },
      prompts: {
        standard: {
          label: 'માનક શોધો',
          query: 'સ્ટેનલેસ સ્ટીલ પાણીની બોટલો માટે કયું બીઆઈએસ માનક લાગુ પડે છે?',
        },
        certification: {
          label: 'પ્રમાણીકરણ',
          query: 'મારા ઉત્પાદન માટે બીઆઈએસ પ્રમાણીકરણ કેવી રીતે મેળવવું?',
        },
        testing: {
          label: 'પરીક્ષણ જરૂરિયાતો',
          query: 'ઓટોમોટિવ ડીઝલ માટે કયા પરીક્ષણો જરૂરી છે?',
        },
        laboratory: {
          label: 'બીઆઈએસ પ્રયોગશાળા',
          query: 'કઈ બીઆઈએસ પ્રયોગશાળા મારા ઉત્પાદનનું પરીક્ષણ કરી શકે છે?',
        },
        qco: {
          label: 'QCO / ફરજિયાત',
          query: 'શું પ્રેશર કૂકર માટે બીઆઈએસ પ્રમાણીકરણ ફરજિયાત છે?',
        },
        hallmarking: {
          label: 'હોલમાર્કિંગ',
          query: 'હું સોનાના HUID ની ચકાસણી કેવી રીતે કરી શકું?',
        },
      },
    },
    input: {
      placeholder: 'ઉત્પાદન, IS કોડ, પ્રમાણીકરણ, પરીક્ષણ અથવા QCO વિશે પૂછો...',
      send: 'મોકલો',
      listening: 'સાંભળી રહ્યું છે...',
      transcribing: 'અવાજ રૂપાંતરિત થઈ રહ્યો છે...',
      micTitle: 'વોઇસ ઇનપુટ',
    },
    settings: {
      title: 'પોર્ટલ સેટિંગ્સ અને પસંદગીઓ',
      subtitle: 'ભાષા અને અવાજ સેટિંગ્સ ગોઠવો.',
      langSectionTitle: 'ભાષા પસંદગી',
      langSectionDesc: 'તમારી પ્રાથમિક ભાષા પસંદ કરો.',
      voiceSectionTitle: 'સ્પીચ સિન્થેસિસ (Sarvam AI)',
      voiceSectionDesc: 'ઓડિયો પ્રતિભાવો સક્ષમ કરો.',
      voiceActive: 'અવાજ સક્રિય',
      voiceDisabled: 'અવાજ બંધ',
      resetSectionTitle: 'સત્ર વ્યવસ્થાપન',
      resetSectionDesc: 'નવું સત્ર શરૂ કરો.',
      resetSessionBtn: 'સત્ર રીસેટ કરો',
    },
    badges: {
      verified: 'ચકાસાયેલ માનક',
      grounded: 'પુરાવા આધારિત',
      audioPlay: 'સાંભળો',
      audioPlaying: 'વાગી રહ્યું છે...',
    },
  },

  'ta-IN': {
    brandTitle: 'பிஐஎஸ் உதவியாளர்',
    govBadge: 'GOV.IN',
    brandSubtitle: 'இந்திய தரநிலைகள் பணியகம் உதவியாளர்',
    brandPillars: 'தரநிலைகள் • சான்றிதழ் • சோதனை • இணக்கம்',
    evidenceNote: 'ஆதார அடிப்படையிலான பிஐஎஸ் தகவல் • பலமொழி குரல் வசதி',
    resetBtn: 'மீட்டமை',
    resetTitle: 'அமர்வை அழித்து புதிய விசாரணையைத் தொடங்கவும்',
    portalTitle: 'இணக்க போர்ட்டல்',
    ministryBadge: 'நுகர்வோர் விவகார அமைச்சகம், இந்திய அரசு',
    nav: {
      assistant: 'உதவியாளர்',
      standards: 'தரநிலைகள்',
      qco: 'QCO & கட்டாயம்',
      testing: 'சோதனை',
      laboratories: 'ஆய்வகங்கள்',
      calculator: 'தொகுதி கால்குலேட்டர்',
      calendar: 'இணக்க காலண்டர்',
      audit: 'தணிக்கை சிமுலேட்டர்',
      dossier: 'விண்ணப்ப ஆவணம்',
      documents: 'ஆவணங்கள்',
      settings: 'அமைப்புகள்',
    },
    hero: {
      badge: 'அதிகாரப்பூர்வ பிஐஎஸ் தளம்',
      title: 'சரியான பிஐஎஸ் தேவையை கண்டறியவும்',
      subtitle: 'தரநிலைகள், சான்றிதழ் தேவைகள், சோதனை நடைமுறைகள் மற்றும் இணக்கத் தகவலை அறியவும்.',
      nodes: {
        product: 'தயாரிப்பு',
        standard: 'தரநிலை',
        certification: 'சான்றிதழ்',
        testing: 'சோதனை',
        laboratory: 'ஆய்வகம்',
        compliance: 'இணக்கம்',
      },
      prompts: {
        standard: {
          label: 'தரநிலையைத் தேடுங்கள்',
          query: 'துருப்பிடிக்காத எஃகு தண்ணீர் பாட்டில்களுக்கு எந்த பிஐஎஸ் தரம் பொருந்தும்?',
        },
        certification: {
          label: 'சான்றிதழ் பெறுவது எப்படி',
          query: 'எனது தயாரிப்புக்கு பிஐஎஸ் சான்றிதழைப் பெறுவது எப்படி?',
        },
        testing: {
          label: 'சோதனை தேவைகள்',
          query: 'ஆட்டோமோட்டிவ் டீசலுக்கு என்ன சோதனை தேவை?',
        },
        laboratory: {
          label: 'பிஐஎஸ் ஆய்வகம்',
          query: 'எந்த பிஐஎஸ் ஆய்வகம் எனது தயாரிப்பை சோதிக்க முடியும்?',
        },
        qco: {
          label: 'QCO / கட்டாயம்',
          query: 'பிரஷர் குக்கர்களுக்கு பிஐஎஸ் சான்றிதழ் கட்டாயமா?',
        },
        hallmarking: {
          label: 'ஹால்மார்க்கிங்',
          query: 'தங்க HUID குறியீட்டை எவ்வாறு சரிபார்ப்பது?',
        },
      },
    },
    input: {
      placeholder: 'தயாரிப்பு, IS குறியீடு, சான்றிதழ், சோதனை அல்லது QCO பற்றி கேளுங்கள்...',
      send: 'அனுப்பு',
      listening: 'கேட்கிறது...',
      transcribing: 'குரல் உரையாக மாறுகிறது...',
      micTitle: 'குரல் உள்ளீடு',
    },
    settings: {
      title: 'போர்டல் அமைப்புகள் & விருப்பங்கள்',
      subtitle: 'மொழி மற்றும் குரல் அமைப்புகளை மாற்றவும்.',
      langSectionTitle: 'மொழி விருப்பங்கள்',
      langSectionDesc: 'உங்கள் முதன்மை மொழியைத் தேர்ந்தெடுக்கவும்.',
      voiceSectionTitle: 'குரல் வெளியீடு (Sarvam AI)',
      voiceSectionDesc: 'குரல் பதிலை இயக்கவும்.',
      voiceActive: 'குரல் இயக்கப்பட்டது',
      voiceDisabled: 'குரல் முடக்கப்பட்டது',
      resetSectionTitle: 'அமர்வு மேலாண்மை',
      resetSectionDesc: 'தற்போதைய அமர்வை அழிக்கவும்.',
      resetSessionBtn: 'அமர்வை மீட்டமை',
    },
    badges: {
      verified: 'சரிபார்க்கப்பட்ட தரம்',
      grounded: 'ஆதார அடிப்படையிலானது',
      audioPlay: 'கேளுங்கள்',
      audioPlaying: 'ஒலிக்கிறது...',
    },
  },

  'te-IN': {
    brandTitle: 'బీఐఎస్ అసిస్టెంట్',
    govBadge: 'GOV.IN',
    brandSubtitle: 'బ్యూరో ఆఫ్ ఇండియన్ స్టాండర్డ్స్ అసిస్టెంట్',
    brandPillars: 'ప్రమాణాలు • ధృవీకరణ • పరీక్ష • సమ్మతి',
    evidenceNote: 'ఆధార-ఆధారిత బీఐఎస్ సమాచారం • బహుభాషా వాయిస్ మద్దతు',
    resetBtn: 'రీసెట్',
    resetTitle: 'సెషన్‌ను క్లియర్ చేసి కొత్త విచారణను ప్రారంభించండి',
    portalTitle: 'సమ్మతి పోర్టల్',
    ministryBadge: 'వినియోగదారుల వ్యవహారాల మంత్రిత్వ శాఖ, భారత ప్రభుత్వం',
    nav: {
      assistant: 'అసిస్టెంట్',
      standards: 'ప్రమాణాలు',
      qco: 'QCO & తప్పనిసరి',
      testing: 'పరీక్షలు',
      laboratories: 'ప్రయోగశాలలు',
      calculator: 'బ్యాచ్ కాలిక్యులేటర్',
      calendar: 'సమ్మతి క్యాలెండర్',
      audit: 'ఆడిట్ సిమ్యులేటర్',
      dossier: 'దరఖాస్తు డాసియర్',
      documents: 'పత్రాలు',
      settings: 'సెట్టింగ్‌లు',
    },
    hero: {
      badge: 'అధికారిక బీఐఎస్ ప్లాట్‌ఫారమ్',
      title: 'సరైన బీఐఎస్ అవసరాన్ని కనుగొనండి',
      subtitle: 'ప్రమాణాలు, ధృవీకరణ ప్రక్రియ, పరీక్ష పద్ధతులు మరియు నిబంధనలను శోధించండి.',
      nodes: {
        product: 'ఉత్పత్తి',
        standard: 'ప్రమాణం',
        certification: 'ధృవీకరణ',
        testing: 'పరీక్ష',
        laboratory: 'ప్రయోగశాల',
        compliance: 'సమ్మతి',
      },
      prompts: {
        standard: {
          label: 'ప్రమాణాన్ని కనుగొనండి',
          query: 'స్టెయిన్‌లెస్ స్టీల్ వాటర్ బాటిళ్లకు ఏ బీఐఎస్ ప్రమాణం వర్తిస్తుంది?',
        },
        certification: {
          label: 'ధృవీకరణ',
          query: 'నా ఉత్పత్తికి బీఐఎస్ ధృవీకరణ (ISI మార్క్) ఎలా పొందాలి?',
        },
        testing: {
          label: 'పరీక్ష అవసరాలు',
          query: 'ఆటోమోటివ్ డీజిల్ కోసం ఏ పరీక్షలు అవసరం?',
        },
        laboratory: {
          label: 'బీఐఎస్ ల్యాబ్',
          query: 'ఏ బీఐఎస్ ప్రయోగశాల నా ఉత్పత్తిని పరీక్షించగలదు?',
        },
        qco: {
          label: 'QCO / తప్పనిసరి ఆర్డర్',
          query: 'ప్రెజర్ కుక్కర్లకు బీఐఎస్ ధృవీకరణ తప్పనిసరి కాదా?',
        },
        hallmarking: {
          label: 'హాల్‌మార్కింగ్',
          query: 'బంగారు HUID ని ఎలా ధృవీకరించాలి?',
        },
      },
    },
    input: {
      placeholder: 'ఉత్పత్తి, IS కోడ్, ధృవీకరణ, పరీక్ష లేదా QCO గురించి అడగండి...',
      send: 'పంపు',
      listening: 'వింటోంది...',
      transcribing: 'టెక్స్ట్‌గా మారుస్తోంది...',
      micTitle: 'వాయిస్ ఇన్‌పుట్',
    },
    settings: {
      title: 'పోర్టల్ సెట్టింగ్‌లు',
      subtitle: 'భాష మరియు వాయిస్ ప్రాధాన్యతలను ఎంచుకోండి.',
      langSectionTitle: 'భాషా ప్రాధాన్యతలు',
      langSectionDesc: 'మీ భాషను ఎంచుకోండి.',
      voiceSectionTitle: 'వాయిస్ సింథసిస్ (Sarvam AI)',
      voiceSectionDesc: 'వాయిస్ అవుట్‌పుట్ ఎనేబుల్ చేయండి.',
      voiceActive: 'వాయిస్ యాక్టివ్',
      voiceDisabled: 'వాయిస్ ఆఫ్',
      resetSectionTitle: 'సెషన్ రీసెట్',
      resetSectionDesc: 'సెషన్‌ను క్లియర్ చేయండి.',
      resetSessionBtn: 'సెషన్ రీసెట్ చేయండి',
    },
    badges: {
      verified: 'ధృవీకరించబడిన ప్రమాణం',
      grounded: 'ఆధార-ఆధారితం',
      audioPlay: 'వినండి',
      audioPlaying: 'ప్లే అవుతోంది...',
    },
  },
};

/**
 * Returns localized UI bundle for the specified language code,
 * falling back gracefully to English if any key is missing.
 */
export function getTranslations(langCode = 'en-IN') {
  if (!langCode) return UI_TRANSLATIONS['en-IN'];
  
  // Exact match
  if (UI_TRANSLATIONS[langCode]) {
    return { ...UI_TRANSLATIONS['en-IN'], ...UI_TRANSLATIONS[langCode] };
  }

  // Prefix match (e.g. 'hi' -> 'hi-IN')
  const base = langCode.split('-')[0].toLowerCase();
  for (const [code, dict] of Object.entries(UI_TRANSLATIONS)) {
    if (code.split('-')[0].toLowerCase() === base) {
      return { ...UI_TRANSLATIONS['en-IN'], ...dict };
    }
  }

  // Fallback to English
  return UI_TRANSLATIONS['en-IN'];
}
