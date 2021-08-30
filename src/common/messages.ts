export class Messages {

    static readonly CovidCasesNotFound = `I'm sorry I couldn't find any information about {{region}}. You should use an upper-tier local authority name or an UK nation to request information.`;
    static readonly CovidCasesTooManyRegions = 'I found more than 3 local authorities that match your query. Please be more specific on the region you are interested about.';
    static readonly CovidCasesNoConfirmed = "There are no confirmed coronavirus cases in {{region}}.";

    static readonly CovidCases0New = "There is a total number of {{casesTotal}} confirmed coronavirus cases in {{region}}, with no new cases confirmed on {{date}}.";
    static readonly CovidCases1New = "There is a total number of {{casesTotal}} confirmed coronavirus cases in {{region}}, with 1 new case confirmed on {{date}}.";
    static readonly CovidCasesManyNew = "There is a total number of {{casesTotal}} confirmed coronavirus cases in {{region}}, with {{{newCases}}} new cases confirmed on {{date}}.";

    static readonly CovidCases0NewTotalUnknown = "I'm missing the total number of confirmed coronavirus cases in {{region}}. There are no new cases confirmed on {{date}}.";
    static readonly CovidCases1NewTotalUnknown = "I'm missing the total number of confirmed coronavirus cases in {{region}}. There is 1 new case confirmed on {{date}}.";
    static readonly CovidCasesManyNewTotalUnknown = "I'm missing the total number of confirmed coronavirus cases in {{region}}. There are {{{newCases}}} new cases confirmed on {{date}}.";

    static readonly countryMapping: { [k: string]: any } = {
        "United States": "USA",
        "The Bahamas": "Bahamas",
        "Czechia": "Czech Republic",
        "Falkland Islands (Islas Malvinas)": "Falkland Islands",
        "Federated States of Micronesia": "Micronesia",
        "Pitcairn Islands": "Pitcairn Island",
        "Palestine": "The Occupied Palestinian Territories",
        "Cook Islands": "Cook Islands, Tokelau and Niue",
        "Tokelau": "Cook Islands, Tokelau and Niue",
        "Niue": "Cook Islands, Tokelau and Niue",
        "Saint Helena, Ascension and Tristan da Cunha": "St Helena, Ascension and Tristan da Cunha",
        "Saint Kitts and Nevis": "St Kitts and Nevis",
        "Saint Lucia": "St Lucia",
        "Sint Maarten": "St Maarten",
        "Saint Barthélemy": "St Martin and St Barthélemy",
        "Saint Martin": "St Martin and St Barthélemy",
        "Saint Pierre and Miquelon": "St Pierre & Miquelon",
        "Saint Vincent and the Grenadines": "St Vincent and the Grenadines"
    };

    static readonly MissingCountry = `The Foreign & Commonwealth Office currently advises British nationals to not travel to red list countries. Travel to some countries and territories is currently exempted. Please tell me the country you are interested about and I'll try to find the latest information for you.`;
    static readonly NoTravelAdviceForCountry = `I couldn't find any travel advice for {{country}}. Please check on www.gov.uk the foreign travel advice to find the latest information.`;
    static readonly TravelAdviceResponse = `{{content}} This information is still current at: {{stillcurrent}}.`;
    static readonly TravelAdviceMoreResults = `For more results please say next.`;
    static readonly TravelAdviceMoreResultsStoppedByUser = `That's alright. Is there anything else I can help you with?`;
    static readonly TravelAdviceNoMoreResults = `There are no more travel advice results on '{{subject}}' for {{country}}. If you need more advice, you can try to ask me about a different topic or subject.`;
    static readonly TravelAdviceMultipleTopics = `I found multiple topics on travel advice for {{country}}. Please choose one of the following: {{topicsText}}.`;
    static readonly TravelAdviceMultipleSubjects = `The latest available information I found about {{country}} is from {{updated}}. Please choose from the following available subjects: {{subjectsText}}?`;
    static readonly TravelAdviceMultipleSubjectsWithGenericInfo = `The latest available information I found about {{country}} is from {{updated}}. Do you want to hear the general guidance information or specific subject like: {{subjectsText}}?`;

    static readonly TravelAdviceSummarySingleSubject = `The latest available information from {{updated}} about {{country}} is regarding:
    {{subject}}:
    {{content}}`;

    static readonly TravelAdviceSummaryMultipleSubjects = `The latest available information from {{updated}} about {{country}} is regarding:
    {{subjectsText}}
    Which one do you want to hear more about?`;

    static readonly TravelAdviceGetSubjects = `Available information about {{country}} is regarding:
    {{subjectsText}}
    Which one do you want to hear more about?`;

    static readonly TravelAdviceGetSubjectsTooMany = `There are more than 4 subjects available about {{country}}. 
    You can tell me in your own words what's the subjects you are interested about and I can find the right information for you.`

    static readonly TravelAdviceGetSubjectsSingle = `Only available subject about {{country}} is regarding:
    {{subject}}. 
    Or I could tell you about the general guidance information.`;

    static readonly TravelAdviceSummarySubjectResponse = `{{subject}}:
    {{content}}`;

    static readonly TravelAdviceSummarySubjectMultipleLines = `{{content}}`;

    static readonly TravelAdviceMoreResultsText = [
        `For more results please say next.`,
        `Please say next to hear more.`,
        `Say next to continue.`,
        `Say next or more to continue.`
    ];

    static readonly TravelAdviceTellAboutGeneralInfo = [
        `If you want to hear more I can also tell you about the general guidance information for {{country}} or you can ask about other subjects.`,
        `If you'd like to hear more about {{country}}, I can tell you about the general guidance information or you can ask about other subjects.`,
        `You can ask me about the general guidance information for {{country}} or any other subjects.`,
        `I can also tell you about the general guidance information for {{country}} or you can ask me about other subjects.`,
    ];

    static readonly TravelAdviceRulesNoColor = "Please tell the color list you are interested about: green, amber or red.";

    static readonly TravelAdviceRules = {
        red: 'Rules for red countries: Before you travel to England you must: take a COVID-19 test, book a quarantine hotel package, including 2 COVID-19 tests and complete a passenger locator form. When you arrive in England you must quarantine in a managed hotel, including 2 COVID-19 tests.',
        amber: 'Rules for amber countries: Before you travel to England you must: take a COVID-19 test, book and pay for COVID-19 tests and complete a passenger locator form. You must do these things whether you are fully vaccinated or not. When you arrive in England, if you are fully vaccinated, you must take a COVID-19 test on or before day 2. If you are not fully vaccinated, you must quarantine at home or in the place you are staying for 10 days and take a COVID-19 test on or before day 2 and on or after day 8.',
        green: 'Rules for green countries: Before you travel to England you must: take a COVID-19 test, book and pay for COVID-19 tests and complete a passenger locator form. After you arrive in England you must take a COVID-19 test on or before day 2. You do not need to quarantine unless the test result is positive.'
    };

    static readonly TravelAdviceParameters = {
        country: 'country',
        travelTopic: 'topic',
        travelSubject: 'subject',
        selectedTravelsubject: 'selectedSubject',
        selectedOrdinal: 'ordinal',
        requestedCountry: 'requestedCountry',
        requestedTravelTopic: 'requestedTopic',
        requestedTravelSubject: 'requestedSubject',
        lastPresented: 'lastPresented',
        remainingResults: 'remainingResults',
        travelAdviceMoreResultsTextIndex: 'travelAdviceMoreResultsTextIndex',
        travelAdviceTellAboutGeneralInfoIndex: 'travelAdviceTellAboutGeneralInfoIndex',
        subjectOptions: 'subjectOptions',
        color: 'color'
    };
}