import React, { useState } from "react";
import { Controller, type Control } from "react-hook-form";
import {
  TextField,
  InputAdornment,
  IconButton,
  type TextFieldProps,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

// Khai báo kiểu dữ liệu cho component
export type FormTextFieldProps = {
  name: string;
  control: Control<any>;
  isPassword?: boolean;
  autoTrim?: boolean;
  textCase?: "uppercase" | "lowercase" | "none";
  rainbowText?: boolean;
  isNumericString?: boolean;
} & Omit<TextFieldProps, "name" | "error">;

const FormTextField: React.FC<FormTextFieldProps> = ({
  name,
  control,
  isPassword = false,
  autoTrim = false,
  textCase = "none",
  rainbowText = false,
  isNumericString = false,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  // Xử lý chặn gõ chữ nếu là isNumericString và xử lý Enter để chuyển ô
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Gọi onKeyDown từ props nếu có
    if (rest.onKeyDown) {
      rest.onKeyDown(e);
    }

    // Thêm logic: Nhấn Enter để chuyển ô tiếp theo (bỏ qua nếu là multiline để cho phép xuống dòng)
    if (e.key === "Enter" && !rest.multiline) {
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

    if (!isNumericString) return;

    // Cho phép các phím điều hướng và thao tác copy/paste
    if (
      [
        "Backspace",
        "Tab",
        "Enter",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    )
      return;

    // Chặn nếu không phải là số từ 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Xử lý chặn paste chữ nếu là isNumericString
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!isNumericString) return;

    const paste = e.clipboardData.getData("text");
    if (!/^\d+$/.test(paste)) {
      e.preventDefault();
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          let value = e.target.value;
          if (textCase === "uppercase") value = value.toUpperCase();
          if (textCase === "lowercase") value = value.toLowerCase();

          // Nếu là isNumericString, ép giá trị về dạng Number trước khi cập nhật
          if (isNumericString) {
            field.onChange(value === "" ? "" : Number(value));
          } else {
            field.onChange(value);
          }

          if (rest.onChange) {
            rest.onChange(e);
          }
        };

        const handleBlur = () => {
          if (autoTrim && typeof field.value === "string") {
            field.onChange(field.value.trim());
          }
          field.onBlur();
        };

        return (
          <TextField
            {...rest}
            {...field}
            inputRef={field.ref}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown} // Thêm onKeyDown
            onPaste={rest.onPaste ? rest.onPaste : handlePaste} // Thêm onPaste
            type={
              isPassword
                ? showPassword
                  ? "text"
                  : "password"
                : rest.type || "text"
            }
            size={"small"}
            error={!!error}
            helperText={error ? error.message : rest.helperText}
            InputProps={{
              ...rest.InputProps,
              endAdornment: isPassword ? (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePassword}
                    edge="end"
                    tabIndex={-1}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ) : (
                rest.InputProps?.endAdornment
              ),
              sx: {
                ...(rest.InputProps?.sx || {}),
                ...(rainbowText && {
                  animation: "rainbow-text-animation 3s linear infinite",
                  "@keyframes rainbow-text-animation": {
                    "0%": { color: "#ff0000" },
                    "33%": { color: "#00ff00" },
                    "66%": { color: "#0000ff" },
                    "100%": { color: "#ff0000" },
                  },
                }),
              },
            }}
          />
        );
      }}
    />
  );
};

export default FormTextField;
