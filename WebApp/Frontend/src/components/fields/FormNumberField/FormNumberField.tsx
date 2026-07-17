import React, { useState, useEffect } from "react";
import { Controller, type Control } from "react-hook-form";
import {
  TextField,
  Box,
  ButtonBase,
  type TextFieldProps,
  styled,
} from "@mui/material";
import { KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";

const SpinButtonsMask = styled(Box)({
  position: "absolute",
  right: 1,
  top: 1,
  bottom: 1,
  width: "40px",
  overflow: "hidden",
  borderRadius: "0 3px 3px 0",
  zIndex: 2,
});

const SpinButtonsWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "show",
})<{ show: boolean }>(({ theme, show }) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  borderLeft: `1px solid ${theme.palette.divider}`,
  transform: show ? "translateX(0)" : "translateX(100%)",
  opacity: show ? 1 : 0,
  transition: "all 0.3s ease-in-out",
  backgroundColor: theme.palette.background.paper,
}));

const SpinButton = styled(ButtonBase)(({ theme }) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "&:first-of-type": {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

export type FormNumberFieldProps = {
  name: string;
  control: Control<any>;
  min?: number;
  max?: number;
  step?: number;
  allowDecimal?: boolean;
  decimalScale?: number;
} & Omit<TextFieldProps, "name" | "error" | "type">;

const FormNumberField: React.FC<FormNumberFieldProps> = ({
  name,
  control,
  min = 0,
  max,
  step = 1,
  allowDecimal = false,
  decimalScale,
  ...rest
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const [displayValue, setDisplayValue] = useState<string>("");

        useEffect(() => {
          if (
            field.value === undefined ||
            field.value === null ||
            field.value === ""
          ) {
            setDisplayValue("");
            return;
          }

          const currentRawString = displayValue
            .replace(/\./g, "")
            .replace(",", ".");
          const currentRawNumber = parseFloat(currentRawString);

          if (currentRawNumber !== field.value) {
            let [intPart, decPart] = field.value.toString().split(".");
            intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

            let newVal = intPart;
            if (decPart !== undefined) {
              if (decimalScale !== undefined)
                decPart = decPart.slice(0, decimalScale);
              newVal += `,${decPart}`;
            }
            setDisplayValue(newVal);
          }
        }, [field.value, decimalScale]);

        const updateValue = (delta: number) => {
          if (rest.disabled) return;
          const currentValue = Number(field.value) || 0;
          let newValue = currentValue + delta;

          if (allowDecimal) {
            const multiplier = Math.pow(
              10,
              decimalScale !== undefined ? decimalScale : 4,
            );
            newValue = Math.round(newValue * multiplier) / multiplier;
          }

          if (min !== undefined && newValue < min) newValue = min;
          if (max !== undefined && newValue > max) newValue = max;

          field.onChange(newValue);
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          let rawInput = e.target.value;

          rawInput = rawInput.replace(/[^0-9,]/g, "");

          const parts = rawInput.split(",");
          let intPart = parts[0];
          let decPart = parts.length > 1 ? parts[1] : undefined;

          if (intPart.length > 1 && intPart.startsWith("0")) {
            intPart = intPart.replace(/^0+/, "") || "0";
          }

          intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

          if (decPart !== undefined) {
            if (!allowDecimal) {
              decPart = undefined;
            } else if (decimalScale !== undefined && decimalScale > 0) {
              decPart = decPart.slice(0, decimalScale);
            }
          }

          let newDisplay =
            decPart !== undefined ? `${intPart},${decPart}` : intPart;

          if (rawInput.endsWith(",") && allowDecimal && parts.length === 2) {
            newDisplay = `${intPart},`;
          }

          setDisplayValue(newDisplay);

          const rawNumberString =
            intPart.replace(/\./g, "") +
            (decPart !== undefined ? `.${decPart}` : "");
          const rawNumber = parseFloat(rawNumberString);

          field.onChange(isNaN(rawNumber) ? 0 : rawNumber);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
            return;
          }

          if (
            [
              "Backspace",
              "Tab",
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

          if (e.key === ".") {
            e.preventDefault();
            return;
          }

          if (allowDecimal && e.key === ",") {
            if (displayValue.includes(",")) e.preventDefault();
            return;
          }

          if (!/^[0-9]$/.test(e.key)) {
            e.preventDefault();
          }
        };

        const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
          const paste = e.clipboardData.getData("text");
          const regex = allowDecimal ? /^\d*([.,]\d+)?$/ : /^\d+$/;
          if (!regex.test(paste.replace(/\./g, ""))) {
            e.preventDefault();
          }
        };

        return (
          <Box
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{ width: "100%" }} // SỬA: Đã bỏ position: relative và overflow: hidden ở đây
          >
            <TextField
              {...rest}
              inputRef={field.ref}
              name={field.name}
              onBlur={field.onBlur}
              value={displayValue}
              onChange={handleChange}
              fullWidth
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              error={!!error}
              helperText={error ? error.message : rest.helperText}
              slotProps={{
                htmlInput: {
                  inputMode: allowDecimal ? "decimal" : "numeric",
                },
              }}
              size={"small"}
              InputProps={{
                ...rest.InputProps,
                endAdornment: (
                  <>
                    {rest.InputProps?.endAdornment}
                    {!rest.disabled && (
                      <SpinButtonsMask>
                        <SpinButtonsWrapper show={isHovered}>
                          <SpinButton tabIndex={-1} onClick={() => updateValue(step)}>
                            <KeyboardArrowUp fontSize="small" />
                          </SpinButton>
                          <SpinButton tabIndex={-1} onClick={() => updateValue(-step)}>
                            <KeyboardArrowDown fontSize="small" />
                          </SpinButton>
                        </SpinButtonsWrapper>
                      </SpinButtonsMask>
                    )}
                  </>
                ),
              }}
              sx={{
                "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                {
                  display: "none",
                },
                "& input[type=number]": {
                  MozAppearance: "textfield",
                },
                ...rest.sx,
              }}
              autoComplete="off"
            />
          </Box>
        );
      }}
    />
  );
};

export default FormNumberField;
