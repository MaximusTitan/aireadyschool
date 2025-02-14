export const educationalBoards: { [key: string]: string[] } = {
    Nigeria: ["WAEC", "NECO", "NABTEB", "State Boards"],
    Australia: ["Australian Curriculum", "State-based curricula", "International Baccalaureate (IB)"],
    Canada: ["Provincial Curricula", "International Baccalaureate (IB)"],
    France: ["French National Curriculum", "Baccalauréat", "International Baccalaureate (IB)"],
    Germany: ["Abitur", "Realschulabschluss", "Hauptschulabschluss", "International Baccalaureate (IB)"],
    Ireland: ["Junior Certificate", "Leaving Certificate", "International Baccalaureate (IB)"],
    Japan: ["Japanese National Curriculum", "International Baccalaureate (IB)"],
    Netherlands: ["Dutch National Curriculum", "International Baccalaureate (IB)"],
    "New Zealand": [
      "New Zealand Curriculum",
      "National Certificate of Educational Achievement (NCEA)",
      "International Baccalaureate (IB)",
    ],
    Singapore: ["Singapore-Cambridge GCE", "Integrated Programme", "International Baccalaureate (IB)"],
    Sweden: ["Swedish National Curriculum", "International Baccalaureate (IB)"],
    Switzerland: ["Swiss National Curriculum", "Matura", "International Baccalaureate (IB)"],
    "United Arab Emirates": ["UAE National Curriculum", "CBSE", "International Baccalaureate (IB)"],
    "United Kingdom": ["National Curriculum", "GCSE", "A-Levels", "Scottish Qualifications Authority (SQA)"],
    "United States": [
      "Common Core",
      "Advanced Placement (AP)",
      "International Baccalaureate (IB)",
      "State-specific standards",
    ],
  }
  
  export const getEducationalBoards = (country: string): string[] => {
    return educationalBoards[country] || ["Other"]
  }
  
  