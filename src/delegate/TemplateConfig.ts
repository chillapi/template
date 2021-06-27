import { DelegateConfig } from '@chillapi/api';

export interface TemplateConfig extends DelegateConfig {
    templateVar: string;
    paramVars?: { [k: string]: string };
    assign: string
}