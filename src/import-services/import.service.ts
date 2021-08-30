import fetch from "node-fetch";
import { Config } from "../common/Config";
import { RegionCase, TravelAdvice } from "../models/covid.models";
import { GovUkService } from "./gov-uk.service";

const algoliasearch = require('algoliasearch');
const moment = require('moment');

// import data from coronavirus.data.gov.uk
// see full documentation at https://coronavirus.data.gov.uk/details/developers-guide/main-api
export const callImportCovidCases = async function (request: any, response: any) {
    // import Upper-tier local authority data
    const import1 = await importCovidCases(`utla`);
    // import Nation data (England, Northern Ireland, Scotland, and Wales)
    const import2 = await importCovidCases(`nation`);
    // import Overview data for the United Kingdom
    const import3 = await importCovidCases(`overview`);

    const success = import1 && import2 && import3;
    return response.status(200).send(`Imported ${success}`);
}

// import covid cases for area type
export const importCovidCases = async function (areaType: string) {
    const yesterday = moment().subtract(1, 'days')
    const date = yesterday.format("YYYY-MM-DD");

    const result = await fetch(`${Config.covidDataUrl
        }?filters=areaType=${areaType};date=${date
        }&structure={"date":"date","name":"areaName","code":"areaCode","dailyCases":"newCasesByPublishDate","cumulativeCases":"cumCasesByPublishDate","dailyDeaths":"newDeaths28DaysByPublishDate","cumulativeDeaths":"cumDeaths28DaysByPublishDate"}`
        , {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'GET'
        });

    if (!result.ok) {
        return false;
    }

    const jsonResult = await result.json();

    // API response contains data
    if (jsonResult && jsonResult.data && jsonResult.data.length > 0) {
        const client: any = algoliasearch(Config.algoliaConfig.id, Config.algoliaConfig.adminKey);
        const algoliaIndex = client.initIndex(Config.algoliaConfig.covidCasesIndex);

        const regionData: RegionCase[] = [];
        const data = jsonResult.data;

        // Transform data to RegionCase
        data.forEach((region: any) => {
            const regData = <RegionCase>{
                objectID: region.code,
                region: region.name,
                date: region.date,
                noOfCases: region.dailyCases,
                totalNoOfCases: region.cumulativeCases
            }
            regionData.push(regData);
        });

        try {
            await algoliaIndex.saveObjects(regionData);
        }
        // Save data to Algolia failed. Import is not successful
        catch (error) {
            console.log(error);
            return false;
        }
    }
    // No data returned by API. import is not successful
    else {
        return false;
    }

    return true;
}

// import data from gov.uk/foreign-travel-advice
// parse data for each country https://www.gov.uk/foreign-travel-advice
export const callImportTravelAdvice = async function (request: any, response: any) {

    const letter = request.params['letter']
    if (!letter) {
        return response.status(200);
    }
    const saveToDb = true;

    if (letter === 'all') {
        const results: { saved: boolean; countries: any }[] = [];

        for (const al of Config.allLetters) {
            const letters = al?.split(',');

            if (letters.length > 0) {
                for (const l of letters) {
                    if (l.length === 1) {
                        const res = await PraseCountriesByData(saveToDb, l, null);
                        results.push({ saved: res.saved, countries: res.countries });
                    }
                }
            }
        }
        return response.status(200).send(results);

    } else if (letter.length === 1) {
        const { saved, countries, travelAdvices } = await PraseCountriesByData(saveToDb, letter, null);
        return response.status(200).send({ saved: saved, countries, travelAdvices });

    } else {
        const { saved, countries, travelAdvices } = await PraseCountriesByData(saveToDb, null, letter);
        return response.status(200).send({ saved: saved, countries, travelAdvices });
    }
}

// parse countries data, for a specific letter
async function PraseCountriesByData(saveToDb: boolean, letter: string | null, name: string | null) {
    const govUkService = new GovUkService();
    let countries = <string[]>[];
    let travelAdvices = <TravelAdvice[]>[];

    if (letter) {
        countries = await govUkService.parseCountriesData(Config.travelAdviceUrl, letter);
    }
    if (name) {
        countries.push(name);
    }

    for (const country of countries) {
        try {
            // Summary data
            const travelAdvice = await govUkService.parseSummaryData(Config.travelAdviceUrl, country);
            travelAdvices = [...travelAdvices, ...travelAdvice];
        }
        catch (error) {
            console.log(error);
        }
    }

    let saved = false;
    if (saveToDb) {
        try {
            saved = await govUkService.replaceSummaryData(travelAdvices);
        }
        catch (error) {
            console.log(error);
        }
    }
    return { saved, countries, travelAdvices };
}