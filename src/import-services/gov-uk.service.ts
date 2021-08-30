import * as cheerio from "cheerio";
import fetch, { Response } from "node-fetch";
import { Config } from "../common/Config";
import { TravelAdvice } from "../models/covid.models";

const algoliasearch = require('algoliasearch');

export class GovUkService {

    public parseCountriesData = async (baseUrl: string, letter: string): Promise<any> => {

        const res = await this.fetchData(baseUrl);

        if (!res) {
            return null;
        }
        const html = await res.text();
        const countriesList = <string[]>[];

        const $ = cheerio.load(html);
        const $countries = $(`#${letter.toUpperCase()} > ul`);

        $countries?.children()?.each((index: number, element: any) => {
            const txt = $(element).find('a')?.text();
            countriesList.push(txt);
        });

        return countriesList;
    }

    public parseSummaryData = async (baseUrl: string, country: string): Promise<TravelAdvice[]> => {

        const urlToParse = baseUrl + country.toLowerCase()
            .replace(/ \(\w*\)/ig, '')
            .replace(/&/ig, 'and')
            .replace(/[ /(,']/ig, '-')
            .replace(/--/ig, '-').replace(/--/ig, '-')
            .replace(/\)/ig, '')
            .replace(/é/ig, 'e').replace(/ç/ig, 'c').replace(/ô/ig, 'o').replace(/ã/ig, 'a');

        const res = await this.fetchData(urlToParse);
        const errors = <any[]>[];

        if (!res) {
            throw Error(`No data was found at: ${urlToParse}`);
        }

        const html = await res.text();
        const travelAdvices = <TravelAdvice[]>[];
        const travelAdviceBase = <TravelAdvice>{
            category: 'Foreign travel advice',
            permalink: urlToParse,
            country: country,
            topic: 'Summary',
        };

        const $ = cheerio.load(html);
        const $summaryTitle = $('#content > div:nth-child(2) > div.govuk-grid-column-two-thirds > h1');
        const summaryInfo = $summaryTitle.siblings('div')[0];

        if (summaryInfo) {
            travelAdviceBase.still_current_at = $(summaryInfo).find('dl > dd:nth-child(2)').text().trim();
            travelAdviceBase.updated = $(summaryInfo).find('dl > dd:nth-child(4)').text().trim();
        }

        const summaryContent = $summaryTitle.siblings('div')[1];

        if (summaryContent) {
            const textPragraphs = <string[]>[];
            const minLength = 500;

            // General information
            const $summaryParagraphs = $(summaryContent).find('> p');
            $summaryParagraphs.each((index: number, element: any) => {
                try {
                    let pText = $(element).text()?.trim();

                    if (pText) {

                        // clean text
                        pText = pText.replace(/See /ig, 'Please also visit gov.uk for ')
                            .replace(/ section/ig, ' topic')
                            .replace(/ page/ig, ' subject')
                            .replace(/ our /ig, ' gov.uk ')
                            .replace(/&#x2019;/ig, `'`);

                        if (element.next?.next?.name === 'ul') {
                            const $ul = $(element.next.next);
                            // parse the content of <ul>
                            $ul.children()?.each((i: number, l: any) => {
                                const lText = $(l).text()?.trim();
                                pText = pText + '\n - ' + lText + ';';
                            });
                        }

                        textPragraphs.push(pText);
                    }
                } catch (error) {
                    errors.push(error);
                }
            });

            // join next contents if they are too short
            textPragraphs.map((tp, i, a) => {
                try {
                    if (tp?.length > 0) {
                        if (tp?.length < minLength) {
                            if (a[i]?.length + a[i + 1]?.length < minLength) {
                                a[i] = a[i] + '\n\n' + a[i + 1];
                                a[i + 1] = '';

                                if (a[i]?.length + a[i + 2]?.length < minLength) {
                                    a[i] = a[i] + '\n\n' + a[i + 2];
                                    a[i + 2] = '';
                                }
                            }
                        }
                        const values = {
                            subject: "General information",
                            content: a[i],
                            line: i + 1,
                            objectID: 0
                        };
                        values.objectID = this.hashCode(country + values.subject + values.line + values.content);

                        travelAdvices.push({
                            ...travelAdviceBase,
                            ...values
                        });
                    }
                } catch (error) {
                    errors.push(error);
                }
            });

            // renumber all the lines
            travelAdvices.map((ta, i) => { ta.line = i + 1 });

            // Boxed information
            const $summaryBox = $(summaryContent).find('> .call-to-action');
            const $notes = $summaryBox.find('[role=note]');
            $notes?.each((i: any, note: any) => {
                try {
                    const start = $summaryBox.children().index($notes.eq(i));
                    let end = $summaryBox.children().index($notes.eq(i + 1));
                    end = end > 1 ? end : $summaryBox.children().length;

                    const uls = $summaryBox.children().get().slice(start + 1, end);
                    const texts = uls?.map((ul: any, j: any) => {
                        const $ul = $(ul);
                        let pText = '';

                        if ($ul) {
                            if (ul.name === 'ul') {
                                // parse the content of <ul>
                                $ul.children()?.each((k: any, l: any) => {
                                    const lText = $(l).text()?.trim();
                                    pText = pText + (k === 0 && j === 0 ? ' - ' : '\n - ') + lText.replace(/[.;,]/ig, '') + ';';
                                });
                            } else {
                                // just get the text if it is a <p>
                                pText = pText + '\n' + $ul.text()?.trim();
                            }

                            // remove any html a tags
                            pText = pText.replace(/<a .+">/ig, '').replace(/<\/a>/ig, '');

                            // clean text
                            pText = pText.replace(/See /ig, 'Please also visit gov.uk for ')
                                .replace(/ section/ig, ' topic')
                                .replace(/ page/ig, ' subject')
                                .replace(/ our /ig, ' gov.uk ')
                                .replace(/&#x2019;/ig, `'`);
                        }
                        return pText;
                    }).join('');

                    // note title exists and text is at least 3 characters
                    if ($notes?.eq(i)?.text() && texts?.length > 3) {

                        const values = {
                            subject: $notes?.eq(i)?.text()?.trim(),
                            content: texts,
                            line: 1,
                            objectID: 0
                        };
                        values.objectID = this.hashCode(country + values.subject + values.line + values.content);

                        travelAdvices.push({
                            ...travelAdviceBase,
                            ...values
                        });
                    }
                } catch (error) {
                    errors.push(error);
                }
            })
        }

        if (errors?.length > 0) { throw errors }

        return travelAdvices;
    }

    public replaceSummaryData = async (travelAdvices: TravelAdvice[]): Promise<boolean> => {

        let countries = travelAdvices.map(s => s.country);
        countries = countries.filter((value, index, array) => array.indexOf(value) === index)

        const client: any = algoliasearch(Config.algoliaConfig.id, Config.algoliaConfig.adminKey);
        const algoliaIndex = client.initIndex(Config.algoliaConfig.travelAdviceIndex);

        try {
            for (const country of countries) {

                const deleted = await algoliaIndex.deleteBy({
                    filters: `country:"${country}" AND category:"Foreign travel advice"`
                });
            }
        } catch (error) { throw error; }

        try {
            await algoliaIndex.saveObjects(travelAdvices);
            return true;

        } catch (error) { throw error; }

    }

    private fetchData = async (urlToFetch: string): Promise<Response> => {
        try {
            const response = await fetch(urlToFetch);
            if (response.status !== 200) {
                throw Error("Error occurred while fetching data");
            }
            return response;
        } catch (error) {
            throw error;
        }
    }

    private hashCode = (s: string) => {
        let h = 0, i = 0;
        const l = s.length;
        if (l > 0)
            while (i < l)
                h = (h << 5) - h + s.charCodeAt(i++) | 0;
        return h;
    };
}