# covid19-chatbot
Covid19 chatbot is a chatbot developed with Dialogflow CX which can provide general information about coronavirus and travel advice for the UK using Algolia Search.

This project contains API endpoints for data imports and webhook methods for the chatbot and the exported agent.

## Build and start the APIs
- run: **npm install**
- run: **npm run build**
- run: **npm run start**

If successful, you'll see the message: "The application is listening on port 3000!" in the terminal.

## Configure Algolia account
- Create a free account at https://www.algolia.com
- Create 2 empty indices called **covid_cases** and **travel_advice**
- Update **id** and **adminKey** under algoliaConfig in config.ts. You can find this information under API Keys in Algolia (Application ID and Admin API Key)
```
    static readonly algoliaConfig = {
        id: '',
        adminKey: '',
        covidCasesIndex: 'covid_cases',
        travelAdviceIndex: 'travel_advice'
    };
```
- Rebuild and restart the APIs
- Import covid cases by region from coronavirus.data.gov.uk (see https://coronavirus.data.gov.uk/details/developers-guide/main-api). Data is imported for the previous day and contains information about new cases and total number of cases for local authorities, nations(England, Northern Ireland, Scotland, and Wales) or overview(UK). 
> **Endpoint**: baseUrl/import/covidCases
- Import travel advice from gov.uk foreign-travel-advice (see https://www.gov.uk/foreign-travel-advice). Import method will parse the website and extract data about travel restrictions to a specific country, rules on returning to the UK from a specific country or general information about traveling. Import endpoint expects a specific letter and will parse data for all countries with names starting with the specified letter. You'll need to call the endpoint multiple times to import data for all countries.
> **Endpoint**: baseUrl/import/travelAdvice/A

#### Configure indices in Algolia
Select **covid_cases** index under Indices in Algolia and go to Configuration tab
- Add **region** as **unordered** under Searchable attributes
- Add **region** as **not searchable** under Facets

Select **travel advice** index under Indices in Algolia and go to Configuration tab
- Add **country**, **topic** and **subject** as **ordered** under Searchable attributes
- Add **country**, **category**, **subject** and **line** as **ascending** under Ranking and Sorting
- Add **country**, **category**, **subject** and **topic** as **filter only** under Facets

Now that indices are configured, data can be retrieved.

## Chatbot

Dialogflow CX agent is available under **covidAgent** folder. Follow the instructions from https://cloud.google.com/dialogflow/cx/docs/concept/agent#export to restore the agent from file. 
- Use **global** location for your agent, otherwise @sys.geo-country entities may not be available
- Under Webhooks, update the url as: **baseUrl/covidCXFulfillment**. You can use ngrok (https://ngrok.com/) to expose publicly your localhost url.

#### Agent contains:
- a Route Group for FAQ intents (e.g. symptoms, vaccination, restrictions) with simple fulfillment response.
Conversation examples: 
> "What are the symptoms of coronavirus?",
> "I don't feel very well.",
> "Can I get tested?",
> "Do I need to self isolate?"

- a Route for retrieving the number of covid cases per Region (UK). This is using a webhook and calls into Algolia Search to find the information about the requested region.
Conversation examples: 
> "How many covid cases in Hampshire?",
> "What is the number of covid cases in England?"

- a Page and multiple Routes to provide travel advice for the UK. This is using a webhook and calls into Algolia Search to find the information about requested country and subject.
Conversation examples: 
> "What is the travel advice for Germany?",
> "What do I need to do when returning from Egypt?",
> "General guidance for France"
> "What are the rules for amber countries"

When many subjects are available, users can either name the desired subject or use an ordinal (e.g. first, last) to select.
When agents states that more information is available for the subject, user can say "next" or "more" and "no more" or "enough" to stop the flow.
