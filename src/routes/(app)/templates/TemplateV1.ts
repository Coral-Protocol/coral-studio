export type Template = TemplateV1;
export type TemplateV1 = {
  /**
   * Human-readable template name.
   * Must be unique in local storage.
   */
  name: string;

  /**
   * Optional human-readable description.
   */
  description?: string;

  /**
   * Version of the template schema.
   */
  version: 1;

  /**
   * Unix timestamp (ms) of last update.
   */
  updated: number;

  /**
   * Whether the template is trusted.
   */
  trusted?: boolean;

  payload: {
    version: number;
    data: string;
  };

  /**
   * If true, this template comes from the server's /api/v1/templates endpoint.
   * Server templates have parameters that must be filled in before launching.
   */
  serverTemplate?: boolean;

  /**
   * Server-side template info (only present for server templates).
   */
  serverInfo?: ServerTemplateInfo;
}

export type ServerTemplateParameter = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  secret: boolean;
  default: string | null;
  choices: string[] | null;
}

export type ServerTemplateInfo = {
  slug: string;
  name: string;
  description: string;
  category: string;
  agentCount: number;
  estimatedDuration: string;
  estimatedCost: string;
  parameters: ServerTemplateParameter[];
}