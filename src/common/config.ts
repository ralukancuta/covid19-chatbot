export class Config {
    static readonly algoliaConfig = {
        id: '',
        adminKey: '',
        covidCasesIndex: 'covid_cases',
        travelAdviceIndex: 'travel_advice'
    };

    static readonly travelAdviceUrl = "https://www.gov.uk/foreign-travel-advice/";
    static readonly allLetters = ["A", "B", "C", "D", "E", "F", "G", "H,J", "I", "J", "K", "L", "M", "N", "O,Q,R", "P", "S", "T", "U", "V,W", "Y,Z"];
    static readonly covidDataUrl = "https://api.coronavirus.data.gov.uk/v1/data";
}