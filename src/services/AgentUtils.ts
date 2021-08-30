export class AgentUtils {

    static jsonResponse = (agent: any, response: any) => {
        const jsonResponse = {
            //fulfillment text response to be sent to the agent if there are no defined responses for the specified tag
            fulfillment_response: {
                messages: [
                    {
                        text: {
                            //fulfillment text response to be sent to the agent
                            text: [
                                response
                            ]
                        }
                    }
                ]
            },
            sessionInfo: agent.sessionInfo,
            pageInfo: agent.pageInfo
        };

        return jsonResponse;
    }
}