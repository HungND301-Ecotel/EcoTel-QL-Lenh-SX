import { JobTypeEnum } from "../enums/index";

export const JOB_TYPE_OPTIONS = Object.values(JobTypeEnum).map((value) => ({
    label: value,
    value,
}));