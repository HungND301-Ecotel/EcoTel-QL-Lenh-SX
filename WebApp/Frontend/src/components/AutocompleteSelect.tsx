import { Autocomplete, TextField } from '@mui/material';
import { useMemo } from 'react';
import { StyledPopper } from '../ui/poppers';

interface MultiSelectFieldProps {
    title: string;
    fieldName: string;
    options: any[];
    formik: any;
    initData: any;
    labelKey: string;
}

export const AutocompleteSelect = ({
    title,
    fieldName,
    options,
    formik,
    initData,
    labelKey,
}: MultiSelectFieldProps) => {

    return (
        <Autocomplete
            fullWidth
            options={options}
            getOptionLabel={(option: any) => option[labelKey] || ''}
            value={options.find((d: any) => d._id === formik.values[fieldName]) || null}
            onChange={(event, newValue) => {
                formik.setFieldValue(fieldName, newValue?._id || '');
            }}
            PopperComponent={StyledPopper}
            renderInput={(params) => (
                <TextField {...params} label={title} />
            )}
        />
    );
};
