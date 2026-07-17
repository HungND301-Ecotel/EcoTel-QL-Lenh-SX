import React from "react";
import { Controller, type Control } from "react-hook-form";
import { TimePicker } from "@mui/x-date-pickers";
import { TextField } from "@mui/material";
import dayjs, { type Dayjs } from "dayjs";

export type FormTimePickerProps = {
  name: string;
  control: Control<any>;
  label: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium";
};

/**
 * FormTimePicker – chỉ chọn giờ 24h (HH:mm).
 * Lưu giá trị vào form dưới dạng chuỗi "HH:mm".
 * Mặc định: giờ hiện tại (được set ở ngoài khi khởi tạo defaultValues).
 */
const FormTimePicker: React.FC<FormTimePickerProps> = ({
  name,
  control,
  label,
  disabled = false,
  fullWidth = true,
  size = "small",
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        // Parse giá trị "HH:mm" thành Dayjs để TimePicker hiểu
        const dayjsValue = field.value
          ? dayjs(field.value, "HH:mm")
          : null;

        return (
          <TimePicker
            label={label}
            value={dayjsValue}
            disabled={disabled}
            ampm={false} // 24h
            format="HH:mm"
            onChange={(time: Dayjs | null) => {
              if (time && time.isValid()) {
                field.onChange(time.format("HH:mm"));
              } else {
                field.onChange(null);
              }
            }}
            renderInput={(params) => (
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
                      const form =
                        (e.target as HTMLElement).closest("form") ||
                        document.body;
                      const focusableElements = Array.from(
                        form.querySelectorAll<HTMLElement>(
                          'input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]'
                        )
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
                      if (index > -1 && index < focusableElements.length - 1) {
                        focusableElements[index + 1].focus();
                      }
                    }, 50);
                  }
                }}
              />
            )}
          />
        );
      }}
    />
  );
};

export default FormTimePicker;
