import { BaseCommand, BaseNode, BasePlatformData, Program, Project, Version, VersionPlatformData } from '@voiceflow/api-sdk';

export type Display = { document?: string };

export interface DataAPI<
  P extends Program<any, any> = Program<BaseNode, BaseCommand>,
  V extends Version<any> = Version<VersionPlatformData>,
  PJ extends Project<any, any> = Project<BasePlatformData, BasePlatformData>
> {
  init(): Promise<void>;

  fetchDisplayById(displayId: number): Promise<null | Display>;

  getProgram(programID: string): Promise<P>;

  getVersion(versionID: string): Promise<V>;

  unhashVersionID(versionID: string): Promise<string>;

  getProject(projectID: string): Promise<PJ>;
}
