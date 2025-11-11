/**
 * Zod schemas for request validation
 */

import { z } from 'zod';

export const createUiSchema = z.object({
  message: z.string().min(1).describe('Full users message'),
  searchQuery: z
    .string()
    .min(1)
    .max(100)
    .describe('Generate a search query for 21st.dev (library for searching UI components) to find a UI component that matches the user\'s message. Must be a two-four words max or phrase'),
  absolutePathToCurrentFile: z
    .string()
    .min(1)
    .describe('Absolute path to the current file to which we want to apply changes'),
  absolutePathToProjectDirectory: z
    .string()
    .min(1)
    .describe('Absolute path to the project root directory'),
  standaloneRequestQuery: z
    .string()
    .min(1)
    .describe('You need to formulate what component user wants to create, based on his message, possible chat history and a place where he makes the request. Extract additional context about what should be done to create a ui component/page based on the user\'s message, search query, and conversation history, files. Don\'t hallucinate and be on point.'),
});

export const fetchUiSchema = z.object({
  message: z.string().min(1).describe('Full users message'),
  searchQuery: z
    .string()
    .min(1)
    .max(100)
    .describe('Search query for 21st.dev (library for searching UI components) to find a UI component that matches the user\'s message. Must be a two-four words max or phrase'),
});

export const refineUiSchema = z.object({
  userMessage: z.string().min(1).describe('Full user\'s message about UI refinement'),
  absolutePathToRefiningFile: z
    .string()
    .min(1)
    .describe('Absolute path to the file that needs to be refined'),
  context: z
    .string()
    .describe('Extract the specific UI elements and aspects that need improvement based on user messages, code, and conversation history. Identify exactly which components (buttons, forms, modals, etc.) the user is referring to and what aspects (styling, layout, responsiveness, etc.) they want to enhance. Do not include generic improvements - focus only on what the user explicitly mentions or what can be reasonably inferred from the available context. If nothing specific is mentioned or you cannot determine what needs improvement, return an empty string.'),
});

export const logoSearchSchema = z.object({
  queries: z
    .array(z.string().min(1))
    .min(1)
    .max(10)
    .describe('List of company names to search for logos'),
  format: z.enum(['JSX', 'TSX', 'SVG']).describe('Output format'),
});

export type CreateUiInput = z.infer<typeof createUiSchema>;
export type FetchUiInput = z.infer<typeof fetchUiSchema>;
export type RefineUiInput = z.infer<typeof refineUiSchema>;
export type LogoSearchInput = z.infer<typeof logoSearchSchema>;
