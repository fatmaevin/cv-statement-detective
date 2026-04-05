import { appConfig } from "./config";

export function sanitizeStatement(input){
    const {maxLength,disallowedRegex}=appConfig.validation.statement;
    let cleaned=input.replace(disallowedRegex,"");
    if(cleaned.length>maxLength){
        cleaned=cleaned.slice(0,maxLength);
    }
    return cleaned;
}

