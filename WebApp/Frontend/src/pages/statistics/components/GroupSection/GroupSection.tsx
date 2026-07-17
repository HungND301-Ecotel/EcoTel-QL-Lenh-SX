import { useState, useEffect } from "react";
import {
  Add,
  DeleteOutline,
  ExpandMore,
  AccessTime,
} from "@mui/icons-material";
import {
  Box,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Collapse,
} from "@mui/material";
import { Control, useFieldArray } from "react-hook-form";
import dayjs from "dayjs";
import { ModernIconButton } from "../../../../components/common/ModernUI";
import FormAutocompleteField from "../../../../components/fields/FormAutocompleteField/FormAutocompleteField";
import FormNumberField from "../../../../components/fields/FormNumberField/FormNumberField";
import FormTextField from "../../../../components/fields/FormTextField/FormTextField";
import FormTimePicker from "../../../../components/fields/FormTimePicker/FormTimePicker";

interface TripRow {
  loadingHeight: string;
  loadingModel: string;
  customLoadingModel: string;
  cargoType: string;
  weightInTons: number | "";
  tripCount: number | "";
  underload: number | "";
  tripTimes: string[]; // Mảng giờ cho từng chuyến con, format "HH:mm"
}

interface OptionItem {
  value: string;
  label: string;
}

export const GroupSection = ({
  control,
  groupIndex,
  removeGroup,
  isOnlyGroup,
  watch,
  setValue,
  excavators,
  loadingLocations,
  unloadingLocations,
  shuntingVehicles,
  loadingModels,
  cargoTypes,
  mode,
}: {
  control: Control<any>;
  groupIndex: number;
  removeGroup: () => void;
  isOnlyGroup: boolean;
  watch: any;
  setValue: any;
  excavators: OptionItem[];
  loadingLocations: OptionItem[];
  unloadingLocations: OptionItem[];
  shuntingVehicles: OptionItem[];
  loadingModels: string[];
  cargoTypes: OptionItem[];
  cargoTypesMap: Record<string, string>;
  mode: "INTERNAL" | "OUTSOURCED";
}) => {
  const [expanded, setExpanded] = useState(true);
  const {
    fields: tripFields,
    insert,
    remove: removeTrip,
  } = useFieldArray({ control, name: `groups.${groupIndex}.trips` });

  const emptyTrip: TripRow = {
    loadingHeight: "",
    loadingModel: "",
    customLoadingModel: "",
    cargoType: "",
    weightInTons: "",
    tripCount: 1,
    underload: "",
    tripTimes: [dayjs().format("HH:mm")],
  };

  const currentTrips = watch(`groups.${groupIndex}.trips`) || [];
  const validTripsCount = currentTrips.filter(
    (t: TripRow) => t.tripCount !== "" || t.weightInTons !== "",
  ).length;

  // Sync tripTimes array length với tripCount khi tripCount thay đổi
  useEffect(() => {
    currentTrips.forEach((trip: TripRow, tIdx: number) => {
      const count = Number(trip.tripCount) || 0;
      const currentTimes: string[] = Array.isArray(trip.tripTimes)
        ? trip.tripTimes
        : [];

      if (count !== currentTimes.length && count >= 0) {
        const now = dayjs().format("HH:mm");
        let newTimes: string[];
        if (count > currentTimes.length) {
          // Thêm các giờ mới (mặc định giờ hiện tại)
          newTimes = [
            ...currentTimes,
            ...Array(count - currentTimes.length).fill(now),
          ];
        } else {
          // Cắt bớt mảng
          newTimes = currentTimes.slice(0, count);
        }
        // Dùng tên field đầy đủ để setValue
        const fieldName = `groups.${groupIndex}.trips.${tIdx}.tripTimes` as any;
        // Chỉ update nếu thực sự khác
        if (JSON.stringify(newTimes) !== JSON.stringify(currentTimes)) {
          // @ts-ignore
          setValue(fieldName, newTimes);
        }
      }
    });
  }, [
    // Chỉ watch tripCount để trigger effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(currentTrips.map((t: TripRow) => t.tripCount)),
  ]);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      elevation={2}
      sx={{
        mb: 3,
        borderRadius: "12px !important",
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        "&:before": { display: "none" },
        backgroundColor: "white",
      }}
    >
      <AccordionSummary
        tabIndex={-1}
        expandIcon={<ExpandMore sx={{ color: "white" }} />}
        sx={{
          bgcolor: "primary.main",
          color: "white",
          px: 2,
          "& .MuiAccordionSummary-content": { my: 1.5 },
          overflow: "hidden",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderBottomLeftRadius: expanded ? 0 : 12,
          borderBottomRightRadius: expanded ? 0 : 12,
        }}
      >
        <Box
          sx={{ display: "flex", flexGrow: 1, alignItems: "center", gap: 2 }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              flexGrow: 1,
              minWidth: 0,
              "& .MuiOutlinedInput-root": {
                color: "primary.contrastText",
                "& fieldset": {
                  borderColor: "primary.contrastText",
                  opacity: 0.6,
                },
                "&:hover fieldset": {
                  borderColor: "primary.contrastText",
                  opacity: 1,
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.contrastText",
                  opacity: 1,
                },
                "& .MuiSvgIcon-root": { color: "primary.contrastText" },
              },
              "& .MuiInputLabel-root": {
                color: "primary.contrastText",
                opacity: 0.8,
                "&.Mui-focused": { color: "primary.contrastText", opacity: 1 },
              },
            }}
          >
            {/* === HÀNG 1: 4 TRƯỜNG CHIA ĐỀU NHAU (Mỗi trường chiếm 3 cột trên Desktop) === */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormAutocompleteField
                  name={`groups.${groupIndex}.excavatorId`}
                  control={control}
                  label="Thiết bị xúc"
                  options={excavators}
                  valueKey="value"
                  getOptionLabel={(opt: any) => opt.label || opt}
                  fullWidth
                  limitOptions={20}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormAutocompleteField
                  name={`groups.${groupIndex}.loadingLocation`}
                  control={control}
                  label="Vị trí chất tải"
                  options={loadingLocations}
                  valueKey="value"
                  getOptionLabel={(opt: any) => opt.label || opt}
                  fullWidth
                  limitOptions={20}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormAutocompleteField
                  name={`groups.${groupIndex}.unloadingLocation`}
                  control={control}
                  label="Vị trí dỡ tải"
                  options={unloadingLocations}
                  valueKey="value"
                  getOptionLabel={(opt: any) => opt.label || opt}
                  fullWidth
                  limitOptions={20}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormAutocompleteField
                  name={`groups.${groupIndex}.shuntingVehicle`}
                  control={control}
                  label="Xe quay tải"
                  options={shuntingVehicles}
                  valueKey="value"
                  getOptionLabel={(opt: any) => opt.label || opt}
                  fullWidth
                  limitOptions={20}
                />
              </Grid>
            </Grid>
          </Box>

          {!expanded && validTripsCount > 0 && (
            <Chip
              label={`${validTripsCount} chuyến`}
              size="small"
              color="warning"
              sx={{ fontWeight: "bold", bgcolor: "#FFD54F", color: "black" }}
            />
          )}
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              width: 6,
              flexShrink: 0,
            }}
          >
            {!isOnlyGroup && (
              <ModernIconButton
                icon={DeleteOutline}
                color="error"
                tooltip="Xóa nhóm này"
                onClick={removeGroup}
                tabIndex={-1}
              />
            )}
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          bgcolor: "background.paper",
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          overflowX: "auto",
        }}
      >
        <Box sx={{ minWidth: { xs: "100%", md: 1050 }, pb: 1 }}>
          {tripFields.map((item, tIndex) => {
            const currentModel = watch(
              `groups.${groupIndex}.trips.${tIndex}.loadingModel`,
            );
            const isCustomModel = currentModel === "Khác";

            return (
              <Box key={item.id} sx={{ mb: 2 }}>
                {/* === HÀNG NHẬP LIỆU CHUYẾN === */}
                <Grid
                  container
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    position: "relative",
                    flexWrap: { xs: "wrap", md: "nowrap" },
                  }}
                >
                  {/* STT */}
                  <Grid item xs="auto">
                    <Typography
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        bgcolor: "primary.light",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                      }}
                    >
                      {tIndex + 1}
                    </Typography>
                  </Grid>

                  {/* md: "grow" SẼ CHIA ĐỀU TẤT CẢ CÁC TRƯỜNG NÀY TRÊN 1 HÀNG */}
                  <Grid item xs={12} md>
                    <FormNumberField
                      name={`groups.${groupIndex}.trips.${tIndex}.loadingHeight`}
                      control={control}
                      label="Đ.Cao chất tải"
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md>
                    <FormAutocompleteField
                      name={`groups.${groupIndex}.trips.${tIndex}.cargoType`}
                      control={control}
                      label="Loại hàng"
                      options={cargoTypes}
                      valueKey="value"
                      getOptionLabel={(opt: any) => opt.label || opt}
                      fullWidth
                      limitOptions={20}
                    />
                  </Grid>

                  <Grid item xs={12} md>
                    <FormNumberField
                      name={`groups.${groupIndex}.trips.${tIndex}.tripCount`}
                      control={control}
                      label="Số chuyến"
                      min={1}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} md>
                    <FormAutocompleteField
                      name={`groups.${groupIndex}.trips.${tIndex}.loadingModel`}
                      control={control}
                      label="Mô hình chất tải"
                      options={loadingModels}
                      fullWidth
                    />
                  </Grid>

                  {isCustomModel && (
                    <Grid item xs={12} md>
                      <FormTextField
                        name={`groups.${groupIndex}.trips.${tIndex}.customLoadingModel`}
                        control={control}
                        label="Nhập hệ số"
                        fullWidth
                      />
                    </Grid>
                  )}

                  {mode === "INTERNAL" && (
                    <Grid item xs={12} md>
                      <FormNumberField
                        name={`groups.${groupIndex}.trips.${tIndex}.weightInTons`}
                        control={control}
                        label="Tấn (Cân)"
                        fullWidth
                        allowDecimal
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} md>
                    <FormNumberField
                      name={`groups.${groupIndex}.trips.${tIndex}.underload`}
                      control={control}
                      label="Trừ vơi tải"
                      fullWidth
                      allowDecimal
                    />
                  </Grid>

                  {/* Các nút chức năng (Luôn nằm ở cuối) */}
                  <Grid item xs="auto" sx={{ display: "flex", gap: 0.5 }}>
                    <ModernIconButton
                      icon={Add}
                      color="primary"
                      tooltip="Thêm chuyến bên dưới (Ctrl+E)"
                      onClick={() => insert(tIndex + 1, emptyTrip)}
                      tabIndex={-1}
                    />
                    {tripFields.length > 1 && (
                      <ModernIconButton
                        icon={DeleteOutline}
                        color="error"
                        tooltip="Xóa chuyến này"
                        onClick={() => removeTrip(tIndex)}
                        tabIndex={-1}
                      />
                    )}
                  </Grid>
                </Grid>

                {/* === DANH SÁCH GIỜ TỪNG CHUYẾN CON === */}
                {(() => {
                  const tripCount =
                    Number(
                      watch(`groups.${groupIndex}.trips.${tIndex}.tripCount`),
                    ) || 0;
                  if (tripCount < 1) return null;

                  return (
                    <Collapse in={tripCount > 0} timeout="auto">
                      <Box
                        sx={{
                          mt: 1,
                          ml: 4.5,
                          p: 1.5,
                          bgcolor: "grey.50",
                          borderRadius: 2,
                          border: "1px dashed",
                          borderColor: "primary.light",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1.5,
                          }}
                        >
                          <AccessTime
                            sx={{ fontSize: 16, color: "primary.main" }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, color: "primary.main" }}
                          >
                            Giờ thực hiện từng chuyến ({tripCount} chuyến)
                          </Typography>
                        </Box>
                        <Grid container spacing={1.5}>
                          {Array.from({ length: tripCount }).map((_, cIdx) => (
                            <Grid
                              item
                              key={cIdx}
                              xs={6}
                              sm={4}
                              md={3}
                              lg={2}
                            >
                              <FormTimePicker
                                name={`groups.${groupIndex}.trips.${tIndex}.tripTimes.${cIdx}`}
                                control={control}
                                label={`Chuyến ${cIdx + 1}`}
                                fullWidth
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Collapse>
                  );
                })()}
              </Box>
            );
          })}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
