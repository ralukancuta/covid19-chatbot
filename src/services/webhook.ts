import { protos } from '@google-cloud/dialogflow-cx';
import { AgentUtils } from './AgentUtils';
import { CovidFlow } from './covid-flow.service';

export const webhookProcessing = async function (request: any, response: any): Promise<any> {
    console.log('webhookProcessing function was triggered');

    const agent = request.body as protos.google.cloud.dialogflow.cx.v3beta1.WebhookRequest;

    const tag = agent.fulfillmentInfo?.tag;
    const covidFlow = new CovidFlow();

    let jsonResponse;

    switch (tag) {
        case "covid.number-of-cases": {
            jsonResponse = await covidFlow.searchCases(agent);
            break;
        }
        case "covid.travel-advice": {
            jsonResponse = await covidFlow.travelAdvice(agent);
            break;
        }
        case "covid.travel-advice-subjects": {
            jsonResponse = await covidFlow.travelAdviceAvailableSubjects(agent);
            break;
        }
        case "covid.travel-advice-more": {
            jsonResponse = await covidFlow.travelAdviceMore(agent);
            break;
        }
        case "covid.travel-advice-no-more": {
            jsonResponse = await covidFlow.travelAdviceNoMore(agent);
            break;
        }
        case "covid.travel-advice-rules": {
            jsonResponse = await covidFlow.travelAdviceRules(agent);
            break;
        }
    }

    if (!jsonResponse) {
        const message = "Sorry, I couldn't find a response for your query. I can help with information about covid19 and latest updates on travel advice. Please tell me how can I help!";

        jsonResponse = AgentUtils.jsonResponse(agent, message);
    }

    return jsonResponse;
}