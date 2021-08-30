export class SessionHelper {
    // get paramater by name from session
    static getParameter(agent: any, paramName: string) {

        if (agent.sessionInfo?.parameters && agent.sessionInfo.parameters[paramName]) {
            return agent.sessionInfo.parameters[paramName];
        }

        return '';
    }

    // get all parameters from session
    static getParameters(agent: any) {
        return agent.sessionInfo?.parameters || {};
    }

    // set parameters to session
    static setParameters(agent: any, parameters: any) {
        const sessionInfo = agent.sessionInfo;
        if (!sessionInfo.parameters) {
            sessionInfo.parameters = {};
        }

        if (parameters) {
            sessionInfo.parameters = {
                ...sessionInfo.parameters,
                ...parameters
            }
        }
    }
}