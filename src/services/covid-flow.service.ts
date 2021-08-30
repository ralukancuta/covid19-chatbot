import { RegionCase, TravelAdvice, TravelAdviceSearchParams } from "../models/covid.models";
import { AgentUtils } from "./AgentUtils";
import { Common } from "../common/common";
import { Messages } from "../common/messages";
import { SessionHelper } from "./SessionHelper";
import { Config } from "../common/Config";

// Covid19 methods for travel advice flow and number of cases
export class CovidFlow {

    // Search number of cases per region
    public searchCases = async (agent: any) => {
        const algoliasearch = require('algoliasearch');
        const client: any = algoliasearch(Config.algoliaConfig.id, Config.algoliaConfig.adminKey);
        const algoliaIndex = client.initIndex(Config.algoliaConfig.covidCasesIndex);

        let region = SessionHelper.getParameter(agent, "region");

        if (region) {
            region = region.original;
        }

        if (region.toLowerCase() === "uk") {
            region = "United Kingdom";
        }

        const filters = `region:"${region}"`;

        //try to filter by exact region
        let responses = await algoliaIndex.search("", { filters: filters });

        //if nothing found, do a full text search instead
        if (responses.hits.length === 0) {
            responses = await algoliaIndex.search(region);
        }

        let response = '';

        // nothing found for region, give response
        if (responses.hits.length === 0) {
            response = Messages.CovidCasesNotFound.replace("{{region}}", region);
        }
        // too many entries for region, response would be too long, so ask user for better filtering
        else if (responses.hits.length > 3) {
            response = Messages.CovidCasesTooManyRegions;
        }
        // build response using found data
        else {
            response = this.buildCasesString(responses.hits);
        }

        return AgentUtils.jsonResponse(agent, response);
    }

    //travel advice
    public travelAdvice = async (agent: any) => {
        const parameters = SessionHelper.getParameters(agent);
        const searchParams: TravelAdviceSearchParams = this.getSearchParameters(parameters);

        if (!searchParams.country) {
            return this.askForCountry(agent, searchParams);
        }
        const searchresults = await this.getTravelAdviceSearchResults(searchParams);

        let response = ''
        let params: any;

        if (searchresults.length === 0) {
            response = Messages.NoTravelAdviceForCountry.replace("{{country}}", searchParams.country);

            params = {
                requestedCountry: searchParams.country,
                requestedTravelTopic: searchParams.topic,
                requestedTravelSubject: searchParams.subject
            };

            SessionHelper.setParameters(agent, params);

            return AgentUtils.jsonResponse(agent, response);
        }

        const generalInfoPresentedindex = SessionHelper.getParameter(agent, Messages.TravelAdviceParameters.travelAdviceTellAboutGeneralInfoIndex);
        let generalInfoArrayindex = Common.randomInteger(0, Messages.TravelAdviceTellAboutGeneralInfo.length - 1);

        if (generalInfoPresentedindex) {
            while (generalInfoArrayindex === generalInfoPresentedindex) {
                generalInfoArrayindex = Common.randomInteger(0, Messages.TravelAdviceTellAboutGeneralInfo.length - 1);
            }
        }

        //special cases to handle Summary Subjects
        if (searchParams.topic === "Summary") {

            //only one response found for query. Return!
            if (searchresults.length === 1) {
                response = Messages.TravelAdviceSummarySubjectResponse.replace("{{subject}}", searchresults[0].subject)
                    .replace("{{content}}", searchresults[0].content);

                response += ` 

${Messages.TravelAdviceTellAboutGeneralInfo[generalInfoArrayindex].replace("{{country}}", searchParams.country)}`;

                params = {
                    requestedCountry: searchParams.country,
                    requestedTravelTopic: searchresults[0].topic,
                    requestedTravelSubject: searchresults[0].subject,
                    travelAdviceTellAboutGeneralInfoIndex: generalInfoArrayindex
                };

                SessionHelper.setParameters(agent, params);
                return AgentUtils.jsonResponse(agent, response);
            }

            //multiple results

            //find all subjects
            let subjects = searchresults.map(r => r.subject);
            subjects = subjects.filter(Common.onlyUnique);

            //single topic, single subject with multiple search results => multiple lines for topic and subject. Pick first line
            if (subjects.length === 1) {
                searchParams.subject = subjects[0];
                let result = searchresults.find(r => r.line && r.line === 1);

                //found line 1, set as last presented
                if (result) {
                    const remainingResults = searchresults.filter(r => result && r.content !== result.content);

                    params = {
                        lastPresented: 1,
                        remainingResults: remainingResults
                    };
                }
                //no result with line=1, just default to first entry in the results
                else {
                    result = searchresults[0];

                    const remainingResults = searchresults.slice(1)

                    params = {
                        ...params,
                        lastPresented: 0,
                        remainingResults: remainingResults
                    };
                }

                response = Messages.TravelAdviceSummarySubjectMultipleLines.replace("{{content}}", result.content);

                const arrayindex = Common.randomInteger(0, Messages.TravelAdviceMoreResultsText.length - 1);

                response += ` 

${Messages.TravelAdviceMoreResultsText[arrayindex]}`;

                params = {
                    ...params,
                    travelAdviceMoreResultsTextIndex: arrayindex
                }
            }
            //many subjects, let user pick a subject first
            else {
                searchParams.subject = '';

                const generalInfoIndex = subjects.indexOf("General information");

                if (generalInfoIndex > -1) {
                    //remove general info from array as that is included in the response already
                    const subjectsToChoose = subjects.filter(r => r !== "General information");

                    //only one subject left: Preparing for your return journey to the UK or Travel may be subject to entry restrictions
                    if (subjectsToChoose.length === 1) {

                        const subjectresult = searchresults.find(r => r.subject === subjectsToChoose[0]);

                        //there should always be one for this scenario
                        if (subjectresult) {
                            response = Messages.TravelAdviceSummarySingleSubject.replace("{{subject}}", subjectsToChoose[0])
                                .replace("{{country}}", subjectresult.country)
                                .replace("{{content}}", subjectresult.content)
                                .replace("{{updated}}", subjectresult.updated);

                            response += ` 

${Messages.TravelAdviceTellAboutGeneralInfo[generalInfoArrayindex].replace("{{country}}", searchParams.country)}`;

                            params = {
                                travelAdviceTellAboutGeneralInfoIndex: generalInfoArrayindex
                            };
                        }
                    }
                    else {
                        const subjectsText = this.buildSubjectsString(subjectsToChoose);

                        response = Messages.TravelAdviceSummaryMultipleSubjects.replace("{{country}}", searchParams.country)
                            .replace("{{subjectsText}}", subjectsText)
                            .replace("{{updated}}", searchresults[0].updated);
                    }

                    params = {
                        ...params,
                        subjectOptions: subjectsToChoose
                    }
                }
                else {
                    const subjectsText = this.buildSubjectsString(subjects);

                    response = Messages.TravelAdviceSummaryMultipleSubjects.replace("{{country}}", searchParams.country)
                        .replace("{{subjectsText}}", subjectsText)
                        .replace("{{updated}}", searchresults[0].updated);

                    params = {
                        ...params,
                        subjectOptions: subjects
                    }
                }
            }
        }
        //other topic
        else {
            //only one response found for query. Return!
            if (searchresults.length === 1) {
                response = Messages.TravelAdviceResponse.replace("{{content}}", searchresults[0].content)
                    .replace("{{stillcurrent}}", searchresults[0].still_current_at || searchresults[0].updated);

                params = {
                    ...params,
                    requestedCountry: searchParams.country,
                    requestedTravelTopic: searchresults[0].topic,
                    requestedTravelSubject: searchresults[0].subject
                };

                SessionHelper.setParameters(agent, params);

                return AgentUtils.jsonResponse(agent, response);
            }

            //many responses. Process them!

            //find all different topics
            let topics = searchresults.map(r => r.topic);
            topics = topics.filter(Common.onlyUnique);

            //single topic with multiple search results
            if (topics.length === 1) {
                searchParams.topic = topics[0];

                //find all subjects
                let subjects = searchresults.map(r => r.subject);
                subjects = subjects.filter(Common.onlyUnique);

                //single topic, single subject with multiple search results => multiple lines for topic and subject. Pick first line
                if (subjects.length === 1) {
                    searchParams.subject = subjects[0];

                    let result = searchresults.find(r => r.line && r.line === 1);

                    //found line 1, set as last presented
                    if (result) {
                        const remainingResults = searchresults.filter(r => result && r.content !== result.content);

                        params = {
                            ...params,
                            lastPresented: 1,
                            remainingResults: remainingResults
                        };
                    }
                    //no result with line=1, just default to first entry in the results
                    else {
                        result = searchresults[0];

                        const remainingResults = searchresults.slice(1)

                        params = {
                            ...params,
                            remainingResults: remainingResults
                        };
                    }

                    response = Messages.TravelAdviceResponse.replace("{{content}}", result.content)
                        .replace("{{stillcurrent}}", result.still_current_at || result.updated);

                    response += ' ' + Messages.TravelAdviceMoreResults;
                }
                //many subjects, let user pick a subject first
                else {
                    const generalInfoIndex = subjects.indexOf("General information");

                    if (generalInfoIndex > -1) {
                        //remove general info from array as that is included in the response already
                        const subjectsToChoose = subjects.filter(r => r !== "General information");

                        const subjectsText = this.buildSubjectsString(subjectsToChoose);

                        response = Messages.TravelAdviceMultipleSubjectsWithGenericInfo.replace("{{updated}}", searchresults[0].updated)
                            .replace("{{country}}", searchParams.country)
                            .replace("{{subjectsText}}", subjectsText);
                    }
                    else {
                        const subjectsText = this.buildSubjectsString(subjects);

                        response = Messages.TravelAdviceMultipleSubjects.replace("{{updated}}", searchresults[0].updated)
                            .replace("{{country}}", searchParams.country)
                            .replace("{{subjectsText}}", subjectsText);
                    }

                    params = {
                        ...params,
                        subjectOptions: subjects
                    }
                }
            }
            //many topics, let user pick a topic first
            else {
                const topicsText = this.buildSubjectsString(topics);

                response = Messages.TravelAdviceMultipleTopics.replace("{{country}}", searchParams.country)
                    .replace("{{topicsText}}", topicsText);

                params = {
                    ...params,
                    topicOptions: topics
                };
            }
        }

        params = {
            ...params,
            requestedCountry: searchParams.country,
            requestedTravelTopic: searchParams.topic,
            requestedTravelSubject: searchParams.subject
        };


        SessionHelper.setParameters(agent, params);

        return AgentUtils.jsonResponse(agent, response);
    }

    public travelAdviceAvailableSubjects = async (agent: any) => {

        const parameters = SessionHelper.getParameters(agent);
        const inputParameters = agent.parameters;
        let country = inputParameters[Messages.TravelAdviceParameters.country] || parameters[Messages.TravelAdviceParameters.requestedCountry];

        if (country && Messages.countryMapping[country]) {
            country = Messages.countryMapping[country];
        }

        const searchParams = <TravelAdviceSearchParams>{
            country: country,
            topic: '',
            subject: ''
        }

        let response = '';

        const searchresults: TravelAdvice[] = await this.getTravelAdviceSearchResults(searchParams);

        //find all subjects
        let subjects = searchresults.map(r => r.subject);
        subjects = subjects.filter(Common.onlyUnique);
        subjects = subjects.filter(r => r !== "General information");

        if (subjects.length === 1) {
            response = Messages.TravelAdviceGetSubjectsSingle.replace("{{country}}", country).replace("{{subject}}", subjects[0]);
        }
        else if (subjects.length > 3) {
            response = Messages.TravelAdviceGetSubjectsTooMany.replace("{{country}}", country);
        }
        else {
            const subjectsText = this.buildSubjectsString(subjects);

            response = Messages.TravelAdviceGetSubjects.replace("{{country}}", country)
                .replace("{{subjectsText}}", subjectsText);
        }

        const params = {
            requestedCountry: country,
            subjectOptions: subjects
        }

        SessionHelper.setParameters(agent, params);

        return AgentUtils.jsonResponse(agent, response);
    }

    public travelAdviceMore = async (agent: any) => {

        const parameters = SessionHelper.getParameters(agent);

        const country = parameters[Messages.TravelAdviceParameters.requestedCountry];
        const subject = parameters[Messages.TravelAdviceParameters.requestedTravelSubject] || '';
        const lastPresented = parameters[Messages.TravelAdviceParameters.lastPresented] || 0;

        const travelAdviceMoreResultsTextIndex = parameters[Messages.TravelAdviceParameters.travelAdviceMoreResultsTextIndex] || 0;
        let remainingResults: TravelAdvice[] = parameters[Messages.TravelAdviceParameters.remainingResults] || [] as TravelAdvice[];

        let response = '';

        //no responses remained to present. Return!
        if (!remainingResults || remainingResults.length === 0) {
            response = Messages.TravelAdviceNoMoreResults.replace("{{subject}}", subject)
                .replace("{{country}}", country);

            return AgentUtils.jsonResponse(agent, response);
        }

        let lineToPresent = 0;
        if (lastPresented !== 0) {
            lineToPresent = lastPresented + 1;
        }

        let result = remainingResults.find(r => r.line && r.line === lineToPresent);

        //found next line to present
        if (result) {
            remainingResults = remainingResults.filter(r => result && r.content !== result.content);
        }
        //no result with line=lineToPresent, just default to first entry in the results
        else {
            result = remainingResults[0];
            remainingResults = remainingResults.slice(1)
        }

        let params: any = {
            lastPresented: lineToPresent,
            remainingResults: remainingResults
        };

        response = Messages.TravelAdviceSummarySubjectMultipleLines.replace("{{content}}", result.content);

        if (remainingResults.length > 0) {

            let arrayindex = Common.randomInteger(0, Messages.TravelAdviceMoreResultsText.length - 1);

            if (travelAdviceMoreResultsTextIndex && travelAdviceMoreResultsTextIndex !== 0) {
                while (arrayindex === travelAdviceMoreResultsTextIndex) {
                    arrayindex = Common.randomInteger(0, Messages.TravelAdviceMoreResultsText.length - 1);
                }
            }

            params = {
                ...params,
                travelAdviceMoreResultsTextIndex: arrayindex
            };

            response += ` 

${Messages.TravelAdviceMoreResultsText[arrayindex]}`;
        }

        SessionHelper.setParameters(agent, params);

        return AgentUtils.jsonResponse(agent, response);
    }

    public travelAdviceNoMore = async (agent: any) => {
        const params = {
            requestedCountry: '',
            requestedTravelTopic: '',
            requestedTravelSubject: '',
            lastPresented: '',
            remainingResults: ''
        };

        const response = Messages.TravelAdviceMoreResultsStoppedByUser;

        SessionHelper.setParameters(agent, params);

        return AgentUtils.jsonResponse(agent, response);
    }

    public travelAdviceRules = async (agent: any) => {

        const parameters = SessionHelper.getParameters(agent);

        const color = parameters[Messages.TravelAdviceParameters.color];

        let response = '';

        if (!color) {
            response = Messages.TravelAdviceRulesNoColor
        }
        else {
            switch (color) {
                case 'red': response = Messages.TravelAdviceRules.red;
                    break;
                case 'amber': response = Messages.TravelAdviceRules.amber;
                    break;
                case 'green': response = Messages.TravelAdviceRules.green;
                    break;
                default: response = Messages.TravelAdviceRulesNoColor;
                    break;
            }
        }

        return AgentUtils.jsonResponse(agent, response);
    }

    private buildCasesString = (hits: RegionCase[]) => {
        let text = '';

        for (let i = 0; i < hits.length; i++) {
            const cases = hits[i].noOfCases;
            const casesTotal = hits[i].totalNoOfCases;
            const date = hits[i].date;

            if (!casesTotal) {
                if (cases === 0) {
                    text += Messages.CovidCases0NewTotalUnknown.replace("{{region}}", hits[i].region)
                        .replace("{{date}}", date);
                }
                else if (cases === 1) {
                    text += Messages.CovidCases1NewTotalUnknown.replace("{{region}}", hits[i].region)
                        .replace("{{date}}", date);
                }
                else {
                    text += Messages.CovidCases1NewTotalUnknown.replace("{{region}}", hits[i].region)
                        .replace("{{newCases}}", `${cases}`)
                        .replace("{{date}}", date);
                }
                if (i === hits.length - 2) {
                    text += ` and `;
                }
                else if (i === hits.length - 1) {
                    text += ``;
                }
                else {
                    text += `, `;
                }
            }
            else if (casesTotal === 0) {
                text += Messages.CovidCasesNoConfirmed.replace("{{region}}", hits[i].region);
            }
            else {
                if (cases === 0) {
                    text += Messages.CovidCases0New.replace("{{region}}", hits[i].region)
                        .replace("{{casesTotal}}", `${casesTotal}`)
                        .replace("{{date}}", date);
                }
                else if (cases === 1) {
                    text += Messages.CovidCases1New.replace("{{region}}", hits[i].region)
                        .replace("{{casesTotal}}", `${casesTotal}`)
                        .replace("{{date}}", date);
                }
                else {
                    text += Messages.CovidCases1New.replace("{{region}}", hits[i].region)
                        .replace("{{casesTotal}}", `${casesTotal}`)
                        .replace("{{newCases}}", `${cases}`)
                        .replace("{{date}}", date);
                }
                if (i === hits.length - 2) {
                    text += ` and `;
                }
                else if (i === hits.length - 1) {
                    text += ``;
                }
                else {
                    text += `, `;
                }
            }
        }
        return text;
    }

    private buildSubjectsString = (subjects: string[]) => {
        let text = ``;

        for (let i = 0; i < subjects.length; i++) {

            if (i === 0) {
                text += ` ${subjects[i]}`;
            }
            else {
                text += `
 ${subjects[i]}`;
            }

            if (i === subjects.length - 2) {
                text += `, and `;
            }
            else if (i === subjects.length - 1) {
                text += `.`;
            }
            else {
                text += `,`;
            }
        }
        return text;
    }

    private getSearchParameters = (parameters: any): TravelAdviceSearchParams => {
        let country: string = parameters[Messages.TravelAdviceParameters.country];
        const prevCountry: string = parameters[Messages.TravelAdviceParameters.requestedCountry];
        let isNewCountry = false;

        //if country parameter has been provided 
        if (country && country.length > 0) {
            //but is not the same as previously requested country, we need to clean topic and subject parameters
            if (prevCountry && prevCountry.length > 0 && country !== prevCountry) {
                isNewCountry = true;
            }
        }
        //no country porvided, set to previously selected one
        else {
            country = prevCountry;
        }

        if (country && Messages.countryMapping[country]) {
            country = Messages.countryMapping[country];
        }

        //try to get topic from input parameter
        let topic: string = parameters[Messages.TravelAdviceParameters.travelTopic];

        //if none provided and is not a new country
        if (!topic && !isNewCountry) {
            //set to previously selected one
            topic = parameters[Messages.TravelAdviceParameters.requestedTravelTopic];
        }

        //if no topic at all, default to Summary
        if (!topic) {
            topic = "summary";
        }

        let subject: string = "";
        //check if a subject has been selected through main travel advice intent. This will come as an array
        const subjectsArray = parameters[Messages.TravelAdviceParameters.travelSubject];
        //check if a subject has been selected through select subject intent
        const selectedTravelsubject = parameters[Messages.TravelAdviceParameters.selectedTravelsubject];
        //check if a subject has been selected through select subject intent using an ordinal
        const selectedOrdinal: any = parameters[Messages.TravelAdviceParameters.selectedOrdinal] || -1;

        //if new country provided
        if (isNewCountry) {
            //if any subjects provided, select the first one
            if (subjectsArray && subjectsArray.length > 0) {
                subject = subjectsArray[0];
            }
        }
        //is not new country
        else {
            //if selectedOrdinal is not -1 then a subject has been selected through select subject intent using an ordinal
            if (selectedOrdinal !== -1) {

                const availableSubjects = parameters[Messages.TravelAdviceParameters.subjectOptions]
                const foundIndex = Common.getIndexFromSelectedOrdinal(selectedOrdinal, availableSubjects);
                if (selectedOrdinal !== -1) {
                    subject = availableSubjects[foundIndex];
                }
            }
            //if selectedTravelsubject then a subject has been selected through select subject intent
            else if (selectedTravelsubject && selectedTravelsubject.length > 0) {
                subject = selectedTravelsubject;
            }
            //is any subjects porvided through main travel advice intent, select first one
            else if (subjectsArray && subjectsArray.length > 0) {
                subject = subjectsArray[0];
            }
            //check if one has been previously requested 
            else {
                subject = parameters[Messages.TravelAdviceParameters.requestedTravelSubject];
            }
        }

        const searchparams = <TravelAdviceSearchParams>{
            country: country, topic: topic, subject: subject
        };

        return searchparams;
    }

    private askForCountry = (agent: any, searchParams: TravelAdviceSearchParams) => {
        const params = {
            requestedCountry: searchParams.country,
            requestedTravelTopic: searchParams.topic,
            requestedTravelSubject: searchParams.subject
        };

        SessionHelper.setParameters(agent, params);

        return AgentUtils.jsonResponse(agent, Messages.MissingCountry);
    }

    private getTravelAdviceSearchResults = async (searchParams: TravelAdviceSearchParams): Promise<TravelAdvice[]> => {
        const algoliasearch = require('algoliasearch');
        const client: any = algoliasearch(Config.algoliaConfig.id, Config.algoliaConfig.adminKey);
        const algoliaIndex = client.initIndex(Config.algoliaConfig.travelAdviceIndex);

        const searchresults: TravelAdvice[] = [];

        let filters = `country:"${searchParams.country}"`;

        if (searchParams.topic && searchParams.topic.length > 0) {
            filters += ` AND topic:"${searchParams.topic}"`;
        }

        let responses;
        try {
            //subject available, include in query
            if (searchParams.subject && searchParams.subject.length > 0) {
                responses = await algoliaIndex.search(searchParams.subject, { filters: filters, hitsPerPage: 100 });
            }

            //nothing found for country, topic and subject or subject not provided => Query by country and topic only
            if (!responses || !responses.hits || responses.hits.length === 0) {
                if (searchParams.topic && searchParams.topic.length > 0) {

                    //get all results for country and topic
                    responses = await algoliaIndex.search("", { filters: filters, hitsPerPage: 100 });
                }
            }

            //nothing found for country and topic => Query by country only
            if (!responses || !responses.hits || responses.hits.length === 0) {

                //get all results for country
                responses = await algoliaIndex.search("", { filters: filters, hitsPerPage: 100 });
            }
        }
        catch (error) {
        }

        if (responses?.hits && responses?.hits?.length > 0) {
            //transform found responses to TravelAdvice objects
            responses?.hits?.forEach((result: any) => {
                const advice = result as TravelAdvice;
                searchresults.push(advice);
            });
        }

        return searchresults;
    }
}

