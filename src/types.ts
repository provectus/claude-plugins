export type ComponentType = "skill" | "agent" | "prompt";

export interface PluginMeta {
  name: string;
  description: string;
  version: string;
  tags: string[];
  components: ComponentType[];
  has_mcps: boolean;
}

export interface Plugin extends PluginMeta {
  skill?: string;
  agent?: string;
  prompt?: string;
  mcps?: object;
}
