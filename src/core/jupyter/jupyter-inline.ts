/*
 * jupyter-inlne.ts
 *
 * Copyright (C) 2020-2022 Posit Software, PBC
 */

import { kCellUserExpressions } from "../../config/constants.ts";
import { executeInlineCodeHandler } from "../execute-inline.ts";
import { kTextHtml, kTextLatex, kTextMarkdown, kTextPlain } from "../mime.ts";
import { displayDataMimeType } from "./display-data.ts";
import {
  JupyterCellWithOptions,
  JupyterToMarkdownOptions,
  JupyterUserExpressionResult,
} from "./types.ts";

export function userExpressionsFromCell(
  cell: JupyterCellWithOptions,
): Map<string, JupyterUserExpressionResult> {
  const userExpressions = (cell.metadata[kCellUserExpressions] || [])
    .reduce((userExpressions, userExpression) => {
      userExpressions.set(userExpression.expression, userExpression.result);
      return userExpressions;
    }, new Map<string, JupyterUserExpressionResult>());
  return userExpressions;
}

export function resolveUserExpressions(
  source: string[],
  userExpressions: Map<string, JupyterUserExpressionResult>,
  options: JupyterToMarkdownOptions,
) {
  // resolve user expressions
  const executeInlineCode = executeInlineCodeHandler(
    options.language,
    (expr: string) => {
      const result = userExpressions.get(expr);
      if (result) {
        const mimeType = displayDataMimeType(result, options);
        if (mimeType) {
          let data = result.data[mimeType];
          if (Array.isArray(data)) {
            data = data.map(String).join("");
          }
          switch (mimeType) {
            case kTextHtml:
              return `${"`"}${data}${"`"}{=html}`;
            case kTextLatex:
              return `${"`"}${data}${"`"}{=tex}`;
            case kTextMarkdown:
            case kTextPlain:
            default:
              return `${data}`;
          }
        }
      }
    },
  );
  for (let i = 0; i < source.length; i++) {
    source[i] = executeInlineCode(source[i]);
  }
}