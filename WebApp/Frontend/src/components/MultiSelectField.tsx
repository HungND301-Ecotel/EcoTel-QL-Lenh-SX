import { Autocomplete, TextField } from '@mui/material';
import { useMemo } from 'react';

interface MultiSelectFieldProps {
    title: string;
    fieldName: string;
    options: any[];
    formik: any;
    initData: any;
    labelKey: string;
}

export const MultiSelectField = ({
    title,
    fieldName,
    options,
    formik,
    initData,
    labelKey,
}: MultiSelectFieldProps) => {

    const initialIds = useMemo(() => {
        return Array.isArray(initData[fieldName])
            ? initData[fieldName].map((d: any) => typeof d === 'object' ? d._id : d)
            : [];
    }, [initData[fieldName]]);

    const selectedItems = useMemo(() => {
        return options.filter((opt) =>
            formik.values[fieldName]?.includes(opt._id)
        );
    }, [options, formik.values[fieldName]]);

    return (
        <Autocomplete
            multiple
            fullWidth
            options={options}
            getOptionLabel={(option: any) => option[labelKey] || ''}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            value={selectedItems}
            onChange={(event, newValue) => {
                const selectedIds = newValue.map((item: any) => item._id);
                const hasDeletedInitial = initialIds.some((id: String) => !selectedIds.includes(id));
                if (hasDeletedInitial) {
                    return;
                }
                formik.setFieldValue(fieldName, selectedIds);
            }}
            renderInput={(params) => (
                <TextField {...params} label={title} />
            )}
        />
    );
};
