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
   * If true, this is a bundled built-in template.
   */
  bundled?: boolean;

  /**
   * Display metadata for bundled templates.
   */
  templateInfo?: TemplateInfo;
}

export type TemplateParameter = {
  key: string;
  label: string;
  description: string;
  required: boolean;
  secret: boolean;
  default: string | null;
  choices: string[] | null;
}

export type TemplateInfo = {
  slug: string;
  name: string;
  description: string;
  category: string;
  agentCount: number;
  estimatedDuration: string;
  estimatedCost: string;
  parameters: TemplateParameter[];
}