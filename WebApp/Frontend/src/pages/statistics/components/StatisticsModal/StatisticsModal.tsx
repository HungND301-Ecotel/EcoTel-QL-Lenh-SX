import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  useTheme,
  Slide,
  GlobalStyles,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi";
import {
  AddLocationAlt,
  Fullscreen,
  FullscreenExit,
  Close,
} from "@mui/icons-material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import StatisticService from "@/services/statisticService";
import { showErrorAlert, showSuccessAlert } from "@/components/Alert";
import FormAutocompleteField from "@/components/fields/FormAutocompleteField/FormAutocompleteField";
import FormTextField from "@/components/fields/FormTextField/FormTextField";
import FormDatePicker from "@/components/fields/FormDatePicker/FormDatePicker";
import { GroupSection } from "../GroupSection/GroupSection";
import { useShifts } from "@/hooks/useShift";
import { FuelSection } from "../FuelSection/FuelSection";
import { IconButton } from "@mui/material";

// --- Interfaces ---
interface TripRow {
  loadingHeight: string;
  loadingModel: string;
  customLoadingModel: string;
  cargoType: string | undefined;
  weightInTons: number | "";
  tripCount: number | "";
  underload: number | "";
  tripTimes: string[]; // Mảng giờ (HH:mm) cho từng chuyến con
}
interface TripGroup {
  excavatorId: string | undefined;
  loadingLocation: string | undefined;
  unloadingLocation: string | undefined;
  shuntingVehicle: string | undefined;
  trips: TripRow[];
}
interface StatisticsModalProps {
  open: boolean;
  onClose: () => void;
  mode: "INTERNAL" | "OUTSOURCED";
  initialValues?: any;
}
interface StatisticsFormData {
  vehicleId: string | undefined;
  vehicleType: string;
  quality: string;
  vehicleTeam: string;
  departmentId: string | undefined;
  capacity: number | "";
  driverLicenseId: string | undefined;
  driverName: string;
  driverTeam: string;
  staffLicenseId: string | undefined;
  staffName: string;
  shift: string | undefined;
  orderDate: Dayjs | null;
  groups: TripGroup[];
  initialGas: number | "";
  additionalGas: number | "";
  finalGas: number | "";
  lubricantReceived: number | "";
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  open,
  onClose,
  mode,
  initialValues,
}) => {
  const [vehicleCounter, setVehicleCounter] = useState(1);
  const isOutsourced = mode === "OUTSOURCED";
  const queryClient = useQueryClient();
  const theme = useTheme();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(() => {
    return localStorage.getItem("stats_modal_fullscreen") === "true";
  });

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  useEffect(() => {
    localStorage.setItem("stats_modal_fullscreen", String(isFullscreen));
  }, [isFullscreen]);

  // --- 1. FETCH DỮ LIỆU TỪ API ---
  const { data: initData } = useQuery({
    queryKey: ["statistics-init-data"],
    queryFn: () => StatisticService.getInitData(),
    enabled: open,
  });

  const { data: shiftRes } = useShifts({}, open);
  const shifts = Array.isArray(shiftRes) ? shiftRes : (shiftRes?.data || []);

  // --- 2. MAP DỮ LIỆU ---
  const vehicleMap = useMemo(() => {
    const map: Record<string, any> = {};
    initData?.trucks?.forEach((t: any) => {
      if (mode === "INTERNAL" && t.source !== "INTERNAL") return;
      if (mode === "OUTSOURCED" && t.source !== "OUTSOURCED") return;

      map[t.code] = {
        id: t._id,
        vehicleType: t.material?.name || "",
        capacity: t.capacity || "",
        quality: t.quality,
        deptCode: t.department?.code || "",
        departmentId: t.department?._id || "",
        departmentName: t.department?.name || "",
      };
    });
    return map;
  }, [initData, mode]);

  const outsourcedDepartments = useMemo(() => {
    if (mode !== "OUTSOURCED" || !initData?.trucks) return [];
    const depts = new Map();
    initData.trucks.forEach((t: any) => {
      if (t.source === "OUTSOURCED" && t.department) {
        depts.set(t.department._id, {
          value: t.department._id,
          label: t.department.name,
        });
      }
    });
    return Array.from(depts.values());
  }, [initData, mode]);

  const userMap = useMemo(() => {
    const map: Record<string, any> = {};
    initData?.users?.forEach((u: any) => {
      map[u.salaryCode] = {
        id: u._id,
        name: u.fullName,
        deptCode: u.department?.code || "",
      };
    });
    return map;
  }, [initData]);

  const cargoTypesMap = useMemo(() => {
    const map: Record<string, string> = {};
    initData?.materials?.forEach((m: any) => {
      map[m._id] = m.acceptedProduct || "";
    });
    return map;
  }, [initData]);

  const excavators =
    initData?.excavators?.map((e: any) => ({ value: e._id, label: e.code })) ||
    [];
  const shuntingVehicles =
    initData?.trucks?.map((t: any) => ({ value: t._id, label: t.code })) || [];

  const locations = useMemo(() => {
    if (!initData?.locations) return [];
    return initData.locations
      .filter((l: any) => !!l.symbol)
      .map((l: any) => ({
        value: l._id,
        label: l.symbol,
        type: l.type,
      }));
  }, [initData]);

  const cargoTypes = useMemo(() => {
    if (!initData?.materials) return [];
    const uniqueMaterials = new Map();
    initData.materials.forEach((m: any) => {
      if (m.symbol) {
        uniqueMaterials.set(m._id, {
          value: m._id,
          label: m.symbol,
        });
      }
    });
    return Array.from(uniqueMaterials.values());
  }, [initData]);

  const loadingModels = ["d", "r", "Khác"];

  // --- 3. FORM HOOKS ---
  const defaultTrip = useMemo<TripRow>(
    () => ({
      loadingHeight: "",
      loadingModel: "d",
      customLoadingModel: "",
      cargoType: undefined,
      weightInTons: 0,
      tripCount: 1,
      underload: 0,
      tripTimes: [dayjs().format("HH:mm")],
    }),
    [],
  );

  const defaultGroup = useMemo<TripGroup>(
    () => ({
      excavatorId: undefined,
      loadingLocation: undefined,
      unloadingLocation: undefined,
      shuntingVehicle: undefined,
      trips: [defaultTrip],
    }),
    [defaultTrip],
  );

  const defaultValues = useMemo<StatisticsFormData>(
    () => ({
      vehicleId: undefined,
      vehicleType: "",
      quality: "",
      vehicleTeam: "",
      departmentId: undefined,
      capacity: "",
      driverLicenseId: undefined,
      driverName: "",
      driverTeam: "",
      staffLicenseId: undefined,
      staffName: "",
      shift: undefined,
      orderDate: dayjs(),
      groups: [defaultGroup],
      initialGas: 0,
      additionalGas: 0,
      finalGas: 0,
      lubricantReceived: 0,
    }),
    [defaultGroup],
  );

  const { control, watch, reset, setValue, getValues, trigger } =
    useForm<StatisticsFormData>({ defaultValues, mode: "onBlur" });
  const {
    fields: groupFields,
    prepend: prependGroup,
    remove: removeGroup,
  } = useFieldArray({ control, name: "groups" });

  // Auto-fill logic
  useEffect(() => {
    const vehicleId = getValues("vehicleId");
    if (!vehicleId) return;

    const info = vehicleMap[vehicleId];
    if (!info) return;
    setValue("vehicleType", info.vehicleType || "");
    setValue("capacity", info.capacity || "");
    setValue("quality", info.quality || "");
    setValue("vehicleTeam", info ? info.deptCode : "");

    if (isOutsourced && info.departmentId) {
      setValue("departmentId", info.departmentId);
    }
  }, [watch("vehicleId"), setValue, vehicleMap, isOutsourced]);

  useEffect(() => {
    if (isOutsourced) {
      const currentVehicle = vehicleMap[getValues("vehicleId") || ""];
      if (
        currentVehicle &&
        currentVehicle.departmentId !== watch("departmentId")
      ) {
        setValue("vehicleId", undefined);
      }
    }
  }, [watch("departmentId"), isOutsourced, vehicleMap, setValue, getValues]);

  useEffect(() => {
    const driverId = watch("driverLicenseId");
    if (!driverId) {
      setValue("driverName", "");
      setValue("driverTeam", "");
      return;
    }
    const info = userMap[driverId];
    setValue("driverName", info?.name || "");
    setValue("driverTeam", info ? info.deptCode : "");
  }, [watch("driverLicenseId"), setValue, userMap]);

  useEffect(() => {
    const staffId = watch("staffLicenseId");
    if (!staffId) {
      setValue("staffName", "");
      return;
    }
    const info = userMap[staffId];
    setValue("staffName", info?.name || "");
  }, [watch("staffLicenseId"), setValue, userMap]);

  // Auto-calculate: Gas tiêu thụ
  useEffect(() => {
    const initial = Number(watch("initialGas")) || 0;
    const additional = Number(watch("additionalGas")) || 0;
    const final = Number(watch("finalGas")) || 0;
    // Dùng as any để TypeScript không la ó vì consumedGas không có trong interface
    setValue("consumedGas" as any, initial + additional - final);
  }, [
    watch("initialGas"),
    watch("additionalGas"),
    watch("finalGas"),
    setValue,
  ]);

  useEffect(() => {
    if (open) {
      if (initialValues && initialValues._id) {
        setVehicleCounter(1);

        const mappedData: StatisticsFormData = {
          vehicleId:
            Object.keys(vehicleMap).find(
              (k) => vehicleMap[k].id === initialValues.device?._id,
            ) || "",
          vehicleType: initialValues.vehicleType || "",
          quality: initialValues.quality || "",
          vehicleTeam: initialValues.device?.department?.code || "",
          departmentId: initialValues.device?.department?._id || "",
          capacity: initialValues.device?.capacity || "",
          driverLicenseId:
            Object.keys(userMap).find(
              (k) => userMap[k].id === initialValues.driver?._id,
            ) || undefined,
          driverName: initialValues.driver?.fullName || "",
          driverTeam: initialValues.driver?.department?.code || "",
          staffLicenseId:
            Object.keys(userMap).find(
              (k) => userMap[k].id === initialValues.staff?._id,
            ) || undefined,
          staffName: initialValues.staff?.fullName || "",
          shift: initialValues.shift?._id || initialValues.shift || undefined,
          orderDate: initialValues.workingDate
            ? dayjs(initialValues.workingDate)
            : dayjs(),
          initialGas:
            initialValues.realInitialGas ?? initialValues.initialGas ?? "",
          additionalGas:
            initialValues.realAdditionalGas ??
            initialValues.additionalGas ??
            "",
          finalGas: initialValues.realFinalGas ?? initialValues.finalGas ?? "",
          lubricantReceived:
            initialValues.realLubricantReceived ??
            initialValues.lubricantReceived ??
            "",
          groups: [
            {
              excavatorId:
                initialValues.excavator?._id ||
                initialValues.excavator ||
                undefined,
              loadingLocation:
                initialValues.fromLocation?._id ||
                initialValues.fromLocation ||
                undefined,
              unloadingLocation:
                initialValues.toLocation?._id ||
                initialValues.toLocation ||
                undefined,
              shuntingVehicle:
                initialValues.shuntingVehicle?._id ||
                initialValues.shuntingVehicle ||
                undefined,
              trips: [
                {
                  loadingHeight: initialValues.loadingHeight || "",
                  loadingModel: ["d", "r"].includes(initialValues.loadingModel)
                    ? initialValues.loadingModel
                    : "Khác",
                  customLoadingModel: ["d", "r"].includes(
                    initialValues.loadingModel,
                  )
                    ? ""
                    : initialValues.loadingModel || "",
                  cargoType:
                    initialValues.material?._id ||
                    initialValues.material ||
                    undefined,
                  weightInTons: initialValues.totalTon || 0,
                  tripCount: initialValues.quantity || 1,
                  underload: initialValues.underload || 0,
                  tripTimes: Array.isArray(initialValues.tripTimes)
                    ? initialValues.tripTimes
                    : Array(initialValues.quantity || 1).fill(
                        dayjs().format("HH:mm"),
                      ),
                },
              ],
            },
          ],
        };

        reset(mappedData);
      } else {
        reset(defaultValues);
        setVehicleCounter(1);
      }

      // Auto-focus ô đầu tiên sau khi reset
      setTimeout(() => {
        firstFieldRef.current?.focus();
      }, 300);
    }
  }, [open, initialValues, reset, vehicleMap, userMap, defaultValues]);

  // --- 4. SUBMIT API ---
  const handleSave = (data: StatisticsFormData, continueNext: boolean) => {
    const vehicle = vehicleMap[data.vehicleId || ""];

    // TRẢ LẠI TÊN BIẾN GỐC CHUẨN CỦA EM
    const processedGroups = data.groups.map((group) => ({
      ...group,
      excavatorId: group.excavatorId,
      loadingLocation: group.loadingLocation,
      unloadingLocation: group.unloadingLocation,
      shuntingVehicle: group.shuntingVehicle,
      trips: group.trips.map((trip: any) => ({
        ...trip,
        loadingModel:
          trip.loadingModel === "Khác"
            ? trip.customLoadingModel || trip.loadingModel
            : trip.loadingModel,
        cargoType: trip.cargoType ?? undefined,
        weightInTons: trip.weightInTons,
        tripCount: trip.tripCount,
        underload: trip.underload,
        loadingHeight: trip.loadingHeight,
        customLoadingModel: trip.customLoadingModel,
        tripTimes: Array.isArray(trip.tripTimes) ? trip.tripTimes : [],
      })),
    }));

    const payload = {
      workingDate: data.orderDate
        ? dayjs(data.orderDate).format("YYYY-MM-DD")
        : null,
      shift: data.shift || null,
      vehicleId: vehicle?.id || null, // KHÔNG ĐỔI THÀNH device NỮA
      driverLicenseId: data.driverLicenseId
        ? userMap[data.driverLicenseId]?.id
        : null,
      staffLicenseId: data.staffLicenseId
        ? userMap[data.staffLicenseId]?.id
        : null,
      initialGas: data.initialGas,
      lubricantReceived: data.lubricantReceived,
      additionalGas: data.additionalGas,
      finalGas: data.finalGas,
      vehicleSource: mode || "INTERNAL",
      groups: processedGroups,
    };

    if (initialValues?._id) {
      StatisticService.batchUpdate(initialValues._id, payload)
        .then(() => {
          showSuccessAlert("Cập nhật thống kê thành công!");
          onClose();
          queryClient.invalidateQueries({ queryKey: ["statistics"] });
        })
        .catch((err) =>
          showErrorAlert(err.response?.data?.message || "Lỗi khi cập nhật"),
        );
    } else {
      StatisticService.batchSave(payload)
        .then(() => {
          showSuccessAlert("Lưu thống kê thành công!");
          if (continueNext) {
            setVehicleCounter((c) => c + 1);
            reset(defaultValues);
          } else {
            onClose();
            setVehicleCounter(1);
          }
          queryClient.invalidateQueries({ queryKey: ["statistics"] });
        })
        .catch((err) =>
          showErrorAlert(err.response?.data?.message || "Lỗi khi lưu"),
        );
    }
  };

  const onCustomSubmit = async (continueNext: boolean) => {
    const data = getValues();
    handleSave(data, continueNext);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      const key = e.key.toLowerCase();

      if (key === "s") {
        e.preventDefault();
        onCustomSubmit(false);
      }
      if (key === "c") {
        e.preventDefault();
        onCustomSubmit(true);
      }
      if (key === "d") {
        e.preventDefault();
        prependGroup(defaultGroup);
      }
      if (key === "e") {
        e.preventDefault();
        const currentGroups = getValues("groups");
        if (currentGroups.length > 0) {
          currentGroups[0].trips.push(defaultTrip);
          setValue("groups", [...currentGroups]);
        }
      }
    };

    window.addEventListener("keydown", handler, { capture: true });
    return () =>
      window.removeEventListener("keydown", handler, { capture: true });
  }, [open, trigger, getValues, prependGroup, setValue, onCustomSubmit]);

  const disabledProps = {
    sx: { "&.Mui-disabled": { WebkitTextFillColor: "rgba(0, 0, 0, 0.75)" } },
  };

  const TRANSITION =
    "width 0.35s cubic-bezier(0.4,0,0.2,1), max-width 0.35s cubic-bezier(0.4,0,0.2,1), height 0.35s cubic-bezier(0.4,0,0.2,1), max-height 0.35s cubic-bezier(0.4,0,0.2,1), margin 0.35s cubic-bezier(0.4,0,0.2,1), border-radius 0.35s cubic-bezier(0.4,0,0.2,1)";

  return (
    <>
      <GlobalStyles
        styles={{
          ".stats-modal-paper": {
            transition: `${TRANSITION} !important`,
          },
        }}
      />
      <Dialog
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
        keepMounted
        scroll="paper"
        maxWidth="xl"
        fullWidth={!isFullscreen}
        PaperProps={{
          component: "form",
          noValidate: true,
          className: "stats-modal-paper",
          sx: {
            width: isFullscreen ? "100vw" : "100%",
            maxWidth: isFullscreen ? "none" : "lg",
            height: isFullscreen ? "100vh" : "90vh",
            maxHeight: isFullscreen ? "100vh" : "90vh",
            margin: isFullscreen ? 0 : 2,
            borderRadius: isFullscreen ? 0 : 3,
            bgcolor: "background.default",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 2, md: 4 },
            py: 2,
            m: 0,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: "primary.main" }}
              >
                Thống Kê Chuyến:{" "}
                {isOutsourced ? "Xe thuê ngoài" : "Xe trong mỏ"}
              </Typography>
              <Chip
                label={`Đang nhập xe thứ: ${vehicleCounter}`}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: "bold", borderWidth: 2 }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                onClick={handleToggleFullscreen}
                color="inherit"
                size="small"
              >
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
              <IconButton onClick={onClose} color="inherit" size="small">
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 0,
            py: 3,
            bgcolor: "background.default",
            overflowY: "auto",
            overflowX: "hidden",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Box
            sx={{
              width: "100%",
              px: { xs: 2, md: 4 },
              boxSizing: "border-box",
            }}
          >
            <Box
              sx={{
                bgcolor: "background.paper",
                p: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                mb: 2,
                mt: 2,
              }}
            >
              {/* --- KHU VỰC ĐƯỢC CHUẨN HÓA GRID --- */}
              <Grid container spacing={2} alignItems="center">
                {/* Dòng 1: Đơn vị (Chỉ hiện khi là Xe thuê ngoài) */}
                {isOutsourced && (
                  <Grid item xs={12}>
                    <FormAutocompleteField
                      name="departmentId"
                      control={control}
                      label="Đơn vị thuê ngoài"
                      options={outsourcedDepartments}
                      valueKey="value"
                      inputRef={firstFieldRef}
                      limitOptions={20}
                    />
                  </Grid>
                )}

                {/* Dòng 2: Thông tin Xe - Tổng = 12 cột */}
                <Grid item xs={12} md={isOutsourced ? 6 : 2}>
                  <FormAutocompleteField
                    name="vehicleId"
                    control={control}
                    label="Số xe"
                    inputRef={!isOutsourced ? firstFieldRef : undefined}
                    options={Object.keys(vehicleMap).filter((code) => {
                      if (!isOutsourced) return true;
                      const deptId = watch("departmentId");
                      return (
                        !deptId || vehicleMap[code].departmentId === deptId
                      );
                    })}
                    limitOptions={20}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormTextField
                    name="vehicleType"
                    control={control}
                    label="Loại xe"
                    disabled
                    InputProps={disabledProps}
                    fullWidth
                  />
                </Grid>
                {isOutsourced ? (
                  <Grid item xs={12} md={3}>
                    <FormTextField
                      name="capacity"
                      control={control}
                      label="Dung tích"
                      disabled
                      InputProps={disabledProps}
                      fullWidth
                    />
                  </Grid>
                ) : (
                  <>
                    <Grid item xs={12} md={3}>
                      <FormTextField
                        name="quality"
                        control={control}
                        label="Chất lượng"
                        disabled
                        InputProps={disabledProps}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormTextField
                        name="vehicleTeam"
                        control={control}
                        label="Thuộc đội"
                        disabled
                        InputProps={disabledProps}
                        fullWidth
                      />
                    </Grid>
                  </>
                )}

                {/* Dòng 3: Thông tin Lái xe - Tổng = 12 cột */}
                <Grid item xs={12} md={2}>
                  <FormAutocompleteField
                    name="driverLicenseId"
                    control={control}
                    label="Số sổ lương lái"
                    options={Object.keys(userMap)}
                    limitOptions={20}
                  />
                </Grid>
                <Grid item xs={12} md={isOutsourced ? 10 : 6}>
                  <FormTextField
                    name="driverName"
                    control={control}
                    label="Lái xe"
                    disabled
                    InputProps={disabledProps}
                    fullWidth
                  />
                </Grid>
                {!isOutsourced && (
                  <Grid item xs={12} md={4}>
                    <FormTextField
                      name="driverTeam"
                      control={control}
                      label="Thuộc đội"
                      disabled
                      InputProps={disabledProps}
                      fullWidth
                    />
                  </Grid>
                )}

                {/* Dòng 4: Cán bộ trực ca (Chỉ Nội bộ) - Tổng = 12 cột */}
                {!isOutsourced && (
                  <>
                    <Grid item xs={12} md={2}>
                      <FormAutocompleteField
                        name="staffLicenseId"
                        control={control}
                        label="Số sổ lương CB"
                        options={Object.keys(userMap)}
                        limitOptions={20}
                      />
                    </Grid>
                    <Grid item xs={12} md={10}>
                      <FormTextField
                        name="staffName"
                        control={control}
                        label="Cán bộ trực ca"
                        disabled
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root.Mui-disabled fieldset": {
                            borderColor:
                              watch("staffName") === "Chưa vào mã cán bộ"
                                ? `${theme.palette.error.main} !important`
                                : undefined,
                          },
                        }}
                        InputProps={{
                          sx: {
                            "&.Mui-disabled": {
                              WebkitTextFillColor:
                                watch("staffName") === "Chưa vào mã cán bộ"
                                  ? theme.palette.error.main
                                  : "rgba(0, 0, 0, 0.75)",
                            },
                          },
                        }}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                {/* Dòng 5: Ca làm việc và Ngày thực hiện - Tổng = 12 cột */}
                <Grid item xs={12} md={6}>
                  <FormAutocompleteField
                    name="shift"
                    control={control}
                    label="Ca làm việc"
                    options={shifts.map((s: any) => ({
                      value: s._id,
                      label: String(s.name),
                    }))}
                    valueKey="value"
                    getOptionLabel={(opt: any) =>
                      String(opt.label || opt || "")
                    }
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormDatePicker
                    name="orderDate"
                    control={control}
                    label="Ngày thực hiện"
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Danh sách Nhóm & Chuyến
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddLocationAlt />}
                onClick={() => prependGroup(defaultGroup)}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: "bold",
                  boxShadow: 2,
                }}
              >
                Thêm Nhóm (Ctrl+D)
              </Button>
            </Box>

            {groupFields.map((group, gIndex) => (
              <GroupSection
                key={group.id}
                control={control}
                groupIndex={gIndex}
                removeGroup={() => removeGroup(gIndex)}
                isOnlyGroup={groupFields.length === 1}
                watch={watch}
                setValue={setValue}
                excavators={excavators}
                loadingLocations={locations?.filter(
                  (l: any) => l.type === "LOADING",
                )}
                unloadingLocations={locations?.filter(
                  (l: any) => l.type === "DUMPING",
                )}
                cargoTypes={cargoTypes}
                shuntingVehicles={shuntingVehicles}
                loadingModels={loadingModels}
                cargoTypesMap={cargoTypesMap}
                mode={mode}
              />
            ))}

            <FuelSection
              control={control}
              watch={watch}
              isOutsourced={isOutsourced}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2, md: 4 },
            py: 3,
            bgcolor: "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
            m: 0,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mr: "auto" }}
          >
            Phím tắt: <b>Ctrl+D</b> (Thêm nhóm) | <b>Ctrl+E</b> (Thêm chuyến)
          </Typography>
          <Button
            onClick={onClose}
            tabIndex={-1}
            sx={{
              color: "text.secondary",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Thoát (ESC)
          </Button>
          <Button
            onClick={() => onCustomSubmit(true)}
            tabIndex={-1}
            variant="outlined"
            color="primary"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 3,
              fontWeight: "bold",
            }}
          >
            Tiếp tục (Ctrl+C)
          </Button>
          <Button
            onClick={() => onCustomSubmit(false)}
            tabIndex={-1}
            variant="contained"
            color="primary"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 2,
              fontWeight: "bold",
              ml: 2,
              boxShadow: 2,
            }}
          >
            Lưu thông tin (Ctrl+S)
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
