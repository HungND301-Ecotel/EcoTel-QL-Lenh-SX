import {
  Autocomplete,
  CircularProgress,
  createFilterOptions,
  Paper,
  styled,
  TextField,
  type AutocompleteProps,
} from "@mui/material";
import { useMemo } from "react";
import { Controller, type Control } from "react-hook-form";

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: 4,
  borderRadius: 8,
  boxShadow: theme.shadows[3],
  border: "1px solid",
  borderColor: theme.palette.divider,
  overflow: "hidden",
}));

interface FormAutocompleteFieldProps<T>
  extends Omit<
    AutocompleteProps<T, any, any, any>,
    "renderInput" | "value" | "onChange"
  > {
  name: string;
  control: Control<any>;
  label: string;
  placeholder?: string;
  loading?: boolean;
  valueKey?: keyof T;
  onSearch?: (keyword: string) => void;
  isAsync?: boolean;
  inputRef?: React.Ref<any>;
  limitOptions?: number;
}

const FormAutocompleteField = <T,>({
  name,
  control,
  label,
  placeholder,
  options,
  loading = false,
  valueKey,
  onSearch,
  isAsync = false,
  inputRef,
  limitOptions,
  ...rest
}: FormAutocompleteFieldProps<T>) => {
  const resolvedFilterOptions = useMemo(() => {
    if (isAsync) {
      return (x: any) => x;
    }
    if (rest.filterOptions) {
      return rest.filterOptions;
    }
    if (limitOptions) {
      return createFilterOptions<any>({ limit: limitOptions });
    }
    return undefined;
  }, [isAsync, rest.filterOptions, limitOptions]);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedValue = useMemo(() => {
          if (!value) return null;

          // Nếu value đã là một object (có chứa data), dùng luôn nó
          if (typeof value === "object" && value !== null) return value;

          // Nếu value là ID (string), tìm trong danh sách options
          if (valueKey && Array.isArray(options)) {
            return (
              options.find(
                (opt: any) =>
                  opt && typeof opt === "object" && opt[valueKey] === value,
              ) || null
            );
          }

          return value || null;
        }, [value, options, valueKey]);

        return (
          <Autocomplete
            {...rest}
            options={options}
            {...(resolvedFilterOptions ? { filterOptions: resolvedFilterOptions } : {})}
            value={selectedValue}
            loading={loading}
            forcePopupIcon={false}
            PaperComponent={(props) => <StyledPaper {...props} />}
            openOnFocus={true}
            autoHighlight={true}
            autoSelect={true}
            selectOnFocus={true}
            clearOnBlur={true}
            size={"small"}
            onInputChange={(event, newInputValue, reason) => {
              if (onSearch && (reason === "input" || reason === "clear")) {
                onSearch(newInputValue);
              }

              if (rest.onInputChange) {
                rest.onInputChange(event, newInputValue, reason);
              }
            }}
            onChange={(_, data) => {
              if (valueKey && data) {
                onChange((data as any)[valueKey]);
              } else {
                onChange(data || null);
              }
            }}
            isOptionEqualToValue={(option: any, val: any) => {
              if (!val) return false;
              const optionId = valueKey ? option[valueKey] : option;
              const valueId = valueKey ? (val[valueKey] ?? val) : val;
              return optionId === valueId;
            }}
            slotProps={{
              clearIndicator: { tabIndex: -1 },
              popupIndicator: { tabIndex: -1 },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={inputRef}
                label={label}
                placeholder={placeholder}
                error={!!error}
                helperText={error?.message}
                variant="outlined"
                autoFocus={rest.autoFocus}
                inputProps={{
                  ...params.inputProps,
                  onKeyDown: (e: any) => {
                    // Gọi hàm onKeyDown mặc định của MUI Autocomplete để xử lý việc "chọn" (select) item trước
                    if (params.inputProps.onKeyDown) {
                      params.inputProps.onKeyDown(e);
                    }

                    if (e.key === "Enter") {
                      // Ngăn chặn submit form mặc định
                      e.preventDefault();

                      // Delay một chút để Autocomplete hoàn tất việc chọn value
                      setTimeout(() => {
                        const form =
                          (e.target as HTMLElement).closest("form") ||
                          document.body;
                        const focusableElements = Array.from(
                          form.querySelectorAll<HTMLElement>(
                            'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]',
                          ),
                        ).filter((el) => {
                          const style = window.getComputedStyle(el);
                          return (
                            style.display !== "none" &&
                            style.visibility !== "hidden" &&
                            el.offsetWidth > 0
                          );
                        });

                        const active = document.activeElement as HTMLElement;
                        const index = focusableElements.indexOf(active);
                        if (
                          index > -1 &&
                          index < focusableElements.length - 1
                        ) {
                          focusableElements[index + 1].focus();
                        }
                      }, 50);
                    }
                  },
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress size={24} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        );
      }}
    />
  );
};

export default FormAutocompleteField;
