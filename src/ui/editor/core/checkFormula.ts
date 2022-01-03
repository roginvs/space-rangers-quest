import { parse } from "../../../lib/formula";

export function checkFormula(str: string) {
  // TODO: Also check that parametes are valid using quest object
  try {
    parse(str);
  } catch (e: any) {
    console.info(e);
    return `${e.message}` || "error";
  }
  return null;
}
