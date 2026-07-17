import React from "react";
import { Controller, type Control } from "react-hook-form";
import { DatePicker, DateTimePicker, TimePicker } from "@mui/x-date-pickers";
import { TextField } from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";

// Khai báo các loại hiển thị mà form hỗ trợ
export type PickerType = "date" | "datetime" | "time" | "month" | "year";

export type FormDatePickerProps = {
  name: string;
  control: Control<any>;
  label: string;
  pickerType?: PickerType;
  format?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium";
};

const FormDatePicker: React.FC<FormDatePickerProps> = ({
  name,
  control,
  label,
  pickerType = "date",
  format,
  disabled = false,
  fullWidth = true,
  size = "small",
  ...rest
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        // Cấu hình dùng chung cho tất cả các loại picker
        const commonProps = {
          label,
          disabled,
          value: field.value ? dayjs(field.value) : null,
          onChange: (date: Dayjs | null) => {
            if (date && date.isValid()) {
              // Nếu là date picker thông thường, chỉ lấy YYYY-MM-DD để tránh lệch múi giờ khi gửi lên server
              if (["date", "month", "year"].includes(pickerType)) {
                field.onChange(date.format("YYYY-MM-DD"));
              } else {
                field.onChange(date.toISOString());
              }
            } else {
              field.onChange(null);
            }
          },
          renderInput: (params: any) => (
            <TextField
              {...params}
              fullWidth={fullWidth}
              size={size}
              error={!!error}
              helperText={error ? error.message : undefined}
              inputRef={field.ref}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setTimeout(() => {
                    const form = (e.target as HTMLElement).closest("form") || document.body;
                    const focusableElements = Array.from(
                      form.querySelectorAll<HTMLElement>(
                        'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]'
                      )
                    ).filter(el => {
                      const style = window.getComputedStyle(el);
                      return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
                    });

                    const active = document.activeElement as HTMLElement;
                    const index = focusableElements.indexOf(active);
                    if (index > -1 && index < focusableElements.length - 1) {
                      focusableElements[index + 1].focus();
                    }
                  }, 50);
                }
              }}
            />
          ),
          ...rest,
        };

        // Render component và format tương ứng dựa vào pickerType
        switch (pickerType) {
          case "datetime":
            return (
              <DateTimePicker
                format={format || "DD/MM/YYYY HH:mm"}
                {...commonProps}
              />
            );
          case "time":
            return <TimePicker format={format || "HH:mm"} {...commonProps} />;
          case "month":
            return (
              <DatePicker
                views={["year", "month"]}
                format={format || "MM/YYYY"}
                {...commonProps}
              />
            );
          case "year":
            return (
              <DatePicker
                views={["year"]}
                format={format || "YYYY"}
                {...commonProps}
              />
            );
          case "date":
          default:
            return (
              <DatePicker format={format || "DD/MM/YYYY"} {...commonProps} />
            );
        }
      }}
    />
  );
};

export default FormDatePicker;
