import React from "react";
import { Grid, Paper, Typography, TextField } from "@mui/material";
import { Control, UseFormWatch } from "react-hook-form";
import FormNumberField from "@/components/fields/FormNumberField/FormNumberField";

interface FuelSectionProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  isOutsourced: boolean;
}

export const FuelSection: React.FC<FuelSectionProps> = ({
  control,
  watch,
  isOutsourced,
}) => {
  if (isOutsourced) return null;

  const initialGas = Number(watch("initialGas")) || 0;
  const additionalGas = Number(watch("additionalGas")) || 0;
  const finalGas = Number(watch("finalGas")) || 0;
  const consumedGas = initialGas + additionalGas - finalGas;

  const disabledProps = {
    sx: { "&.Mui-disabled": { WebkitTextFillColor: "rgba(0, 0, 0, 0.75)" } },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        p: 3,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, mb: 2, color: "text.secondary" }}
      >
        Chỉ số Xăng dầu & Dầu nhờn
      </Typography>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <FormNumberField
            name="initialGas"
            control={control}
            label="Gas tồn đầu"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormNumberField
            name="additionalGas"
            control={control}
            label="Gas bổ sung"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormNumberField
            name="finalGas"
            control={control}
            label="Gas tồn cuối"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Gas tiêu thụ"
            disabled
            size="small"
            value={consumedGas.toLocaleString("vi-VN")}
            InputProps={disabledProps}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};
