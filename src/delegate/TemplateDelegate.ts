import { TemplateConfig } from "./TemplateConfig";
import _ from 'lodash';
import { Delegate } from "@chillapi/api";
import Handlebars from "handlebars";

export class HandlebarsDelegate implements Delegate {

    constructor(private config: TemplateConfig) { }

    async process(context: any, params: any): Promise<void> {
        try {
            const template = Handlebars.compile(_.get(params, this.config.templateVar));
            const data: any = {};
            if (this.config.paramVars) {
                for (const [k, val] of Object.entries(this.config.paramVars)) {
                    data[k] = _.get(params, val);
                }
            }
            params[this.config.assign] = template(data);
        } catch (err) {
            return Promise.reject(err);
        }
        return Promise.resolve();
    }
}