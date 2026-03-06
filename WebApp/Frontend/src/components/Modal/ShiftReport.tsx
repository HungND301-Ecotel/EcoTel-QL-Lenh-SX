import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Autocomplete,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useFormik } from "formik";
import React, { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import api from "../../config/api.config";
import { ShiftReportType, Report, Job, Material } from "../../types";
import { showErrorAlert, showSuccessAlert } from "../Alert";
import { format } from "date-fns";
import { JobTypeEnum } from "../../enums/index";
import MaterialService from "../../services/materialService";
import { StyledPopper } from "../../ui/poppers";
import { Close } from "@mui/icons-material";

export default function ShiftReport({
  open,
  setOpen,
  initialValues,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  initialValues: any;
}) {
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ["reports", initialValues],
    queryFn: () =>
      api
        .get(`/reports/getByOrder/${initialValues._id}`)
        .then((res) => res.data.data),
  });
  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: () => MaterialService.getAll(),
  });
  const { data: shiftReportHistories = [] } = useQuery({
    queryKey: ["shiftReportHistories", initialValues?.shiftReport?._id],
    queryFn: () =>
      api
        .get(`/reporthistories/${initialValues.shiftReport._id}`)
        .then((res) => res.data.data),
    enabled: !!initialValues?.shiftReport?._id && open,
  });

  const reportHistories = useQueries({
    queries: reports.map((r: any) => ({
      queryKey: ["reportHistory", r._id],
      queryFn: () =>
        api.get(`/reporthistories/${r._id}`).then((res) => res.data.data),
      enabled: !!reports.length && open,
    })),
  }) as any[];

  const updateMutation = useMutation({
    mutationFn: (updatedShiftReport: ShiftReportType) =>
      api
        .put(`/shiftReports/${updatedShiftReport._id}`, updatedShiftReport)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      handleClose();
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.message || "Lỗi");
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: (updateReport: Report) =>
      api
        .put(`/reports/${updateReport._id}`, updateReport)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      handleClose();
    },
    onError: (error: any) => {
      showErrorAlert(error.response?.data?.message || error.message || "Lỗi");
    },
  });

  const shiftReportFormik = useFormik({
    initialValues: {
      orderId: "",
      assignedTo: "",
      vehicleSummaries: [
        {
          vehicle: undefined,
          distanceKm: undefined,
          repairHours: undefined,
          travelHours: undefined,
          fuelRemain: undefined,
          fuelReceived: undefined,
          fuelRemainEnd: undefined,
          status: "",
          note: "",
          gpsStatus: "",
          sealStatus: "",
        },
      ],
      vehicleRepair: [
        {
          device: undefined,
          status: "",
          noteRepair: "",
        },
      ],
      handoverHours: undefined,
      shiftHours: undefined,
      handoverNotes: "",
      risks: "",
    },
    onSubmit: () => {},
  });

  const reportFormik = useFormik({
    initialValues: {
      orderId: "",
      vehicleReports: [
        {
          device: undefined,
          excavator: undefined,
          fromLocation: undefined,
          toLocation: undefined,
          material: undefined,
          distanceKm: undefined,
          drillDepth: undefined,
          hardnessF: undefined,
          workingMinutes: undefined,
          quantity: undefined,
          quantityUpdateTimes: [] as {
            time: string | Date;
            quantity: number;
          }[],
        },
      ],
    },
    onSubmit: () => {},
  });

  useEffect(() => {
    if (initialValues && open) {
      const shiftReport = initialValues?.shiftReport;

      shiftReportFormik.setValues({
        orderId: initialValues._id,
        assignedTo: initialValues?.assignedTo?._id,
        vehicleSummaries:
          shiftReport?.vehicleSummaries?.map((v: any) => ({
            vehicle: v?.vehicle?._id,
            distanceKm: v?.distanceKm,
            repairHours: v?.repairHours,
            travelHours: v?.travelHours,
            fuelRemain: v?.fuelRemain,
            fuelReceived: v?.fuelReceived,
            fuelRemainEnd: v?.fuelRemainEnd,
            status: v?.status || "",
            note: v?.note || "",
            gpsStatus: v?.gpsStatus || "",
            sealStatus: v?.sealStatus || "",
          })) || [],
        vehicleRepair:
          shiftReport?.vehicleRepair?.map((v: any) => ({
            device: v?.device?._id,
            status: v?.status || "",
            noteRepair: v?.noteRepair || "",
          })) || [],
        handoverHours: shiftReport?.handoverHours,
        shiftHours: shiftReport?.shiftHours,
        handoverNotes: shiftReport?.handoverNotes || "",
        risks: shiftReport?.risks || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, open]);

  useEffect(() => {
    if (reports.length > 0 && open) {
      reportFormik.setValues({
        orderId: initialValues._id,
        vehicleReports:
          reports.map((v: any) => ({
            _id: v._id,
            device: v.device?._id,
            excavator: v.excavator?._id,
            fromLocation: v.fromLocation?._id,
            toLocation: v.toLocation?._id,
            material: v.material?._id,
            distanceKm: v?.distanceKm,
            drillDepth: v?.drillDepth,
            hardnessF: v?.hardnessF,
            workingMinutes: v?.workingMinutes,
            quantity: v?.quantity,
            quantityUpdateTimes: v?.quantityUpdateTimes,
          })) || [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reports]);

  const handleUpdateAll = async () => {
    
    try {
      await Promise.all(
        [
          updateMutation.mutateAsync({
            ...shiftReportFormik.values,
            _id: initialValues?.shiftReport._id,
          }),
        ].concat(
          reports.length > 0
            ? reportFormik.values.vehicleReports.map((r: any) =>
                updateReportMutation.mutateAsync(r),
              )
            : [],
        ),
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      showSuccessAlert("Cập nhật thành công!");
      handleClose();
    } catch (err: any) {
      showErrorAlert(err.response?.data?.message || err.message || "Lỗi");
    }
  };

  const handleClose = () => {
    setOpen(false);
    shiftReportFormik.resetForm();
    reportFormik.resetForm();
  };

  const shiftReport = initialValues?.shiftReport;

  let isOver48Hours = false;
  if (initialValues?.endTime) {
    const end = new Date(initialValues.endTime);
    if (!isNaN(end.getTime())) {
      const hours = (Date.now() - end.getTime()) / (1000 * 60 * 60);
      isOver48Hours = hours >= 48;
    }
  }

  // ====== NHÓM DỮ LIỆU THEO KHÓA & TÍNH TỔNG ======

  const jobType = (initialValues?.job?.type as Job["type"]) ?? "";

  const idToFormIndex = useMemo(() => {
    const map: Record<string, number> = {};
    (reportFormik.values.vehicleReports || []).forEach(
      (vr: any, idx: number) => {
        if (vr?._id) map[vr._id] = idx;
      },
    );
    return map;
  }, [reportFormik.values.vehicleReports]);

  const historyById = useMemo(() => {
    const m: Record<string, any[]> = {};
    reports.forEach((r: any, i: number) => {
      m[r._id] = reportHistories[i]?.data || [];
    });
    return m;
  }, [reports, reportHistories]);

  function getGroupKey(jt: string, r: any) {
    switch (jt) {
      // case 'Vận hành xúc':
      //     // gộp theo Phương tiện + Vật liệu
      //     return `device:${r.device?._id || ''}__mat:${r.material?._id || ''}`;
      // case 'Vận hành xe':
      //     // gộp theo xe + máy xúc + điểm đến + Vật liệu (tùy nghiệp vụ)
      //     return `device:${r.device?._id || ''}__exc:${r.excavator?._id || ''}__to:${r.toLocation?._id || ''}__mat:${r.material?._id || ''}`;
      case JobTypeEnum.SERVICE_VEHICLE:
        // gộp theo xe + from + to + Vật liệu
        return `device:${r.device?._id || ""}__from:${r.fromLocation?._id || ""}__to:${r.toLocation?._id || ""}__mat:${r.material?._id || ""}`;
      case JobTypeEnum.DOZER:
        // gộp theo device + material
        return `device:${r.device?._id || ""}__mat:${r.material?._id || ""}`;
      case JobTypeEnum.DRILL:
        // để mỗi bản ghi 1 nhóm riêng (không cộng số chuyến)
        return `single:${r._id}`;
      default:
        return `single:${r._id}`;
    }
  }

  type GroupedItem = {
    key: string;
    device?: any;
    material?: any;
    excavator?: any;
    fromLocation?: any;
    toLocation?: any;
    totalQuantity?: number;
    totalDistanceKm?: number;
    totalWorkingMinutes?: number;
    totalDrillDepth?: number;
    totalHardnessF?: number;
    quantityUpdateTimes?: [];
    children: Array<{
      report: any;
      formIndex: number;
      history: any[];
    }>;
  };

  // Nếu muốn tổng cập nhật "live" theo Formik, cộng từ reportFormik thay vì reports
  const groupedReports: GroupedItem[] = useMemo(() => {
    if (!reports?.length) return [];

    const byKey: Record<string, GroupedItem> = {};

    reports.forEach((r: any) => {
      const key = getGroupKey(jobType, r);

      if (!byKey[key]) {
        byKey[key] = {
          key,
          device: r.device,
          material: r.material,
          excavator: r.excavator,
          fromLocation: r.fromLocation,
          toLocation: r.toLocation,
          quantityUpdateTimes: r.quantityUpdateTimes,
          totalQuantity: 0,
          totalDistanceKm: 0,
          totalWorkingMinutes: 0,
          totalDrillDepth: 0,
          totalHardnessF: 0,
          children: [],
        };
      }

      const formIndex = idToFormIndex[r._id];
      const hist = historyById[r._id] || [];
      byKey[key].children.push({ report: r, formIndex, history: hist });

      // Cộng dồn từ Formik để hiển thị tổng "sống"
      const vr = reportFormik.values.vehicleReports?.[formIndex] || {};
      if (
        [
          JobTypeEnum.VEHICLE,
          JobTypeEnum.EXCAVATOR,
          JobTypeEnum.SERVICE_VEHICLE,
        ].includes(jobType)
      ) {
        byKey[key].totalQuantity =
          (byKey[key].totalQuantity || 0) + (Number(vr.quantity) || 0);
      }
      if (jobType === JobTypeEnum.SERVICE_VEHICLE) {
        byKey[key].totalDistanceKm =
          (byKey[key].totalDistanceKm || 0) + (Number(vr.distanceKm) || 0);
        byKey[key].totalWorkingMinutes =
          (byKey[key].totalWorkingMinutes || 0) +
          (Number(vr.workingMinutes) || 0);
      }
      if (jobType === JobTypeEnum.DOZER) {
        byKey[key].totalWorkingMinutes =
          (byKey[key].totalWorkingMinutes || 0) +
          (Number(vr.workingMinutes) || 0);
      }
      if (jobType === JobTypeEnum.DRILL) {
        byKey[key].totalDrillDepth =
          (byKey[key].totalDrillDepth || 0) + (Number(vr.drillDepth) || 0);
        byKey[key].totalHardnessF =
          (byKey[key].totalHardnessF || 0) + (Number(vr.hardnessF) || 0);
      }
    });

    return Object.values(byKey);
  }, [
    reports,
    jobType,
    idToFormIndex,
    historyById,
    reportFormik.values.vehicleReports,
  ]);

  // ====== RENDER ======

  const renderHistoryField = (
    historyArr: any[],
    fieldName: string,
    index: number | null,
    label: string,
  ) => {
    if (!historyArr?.length) return null;

    return historyArr
      .filter((h: any) =>
        h.changes.some(
          (c: any) =>
            c.field === fieldName && (index === null || c.index === index),
        ),
      )
      .map((h: any, i: number) => {
        const changesText = h.changes
          .filter(
            (c: any) =>
              c.field === fieldName && (index === null || c.index === index),
          )
          .map((c: any) => `"${c.oldValue || ""}" → "${c.newValue || ""}"`)
          .join(", ");

        return (
          <Typography
            key={i}
            variant="caption"
            color="secondary"
            display="block"
          >
            Nội dung: {label}: {changesText}, Thay đổi bởi:{" "}
            {h.changedBy?.username}{" "}
            {format(new Date(h.createdAt), "HH:mm dd/MM/yyyy")}
          </Typography>
        );
      });
  };

  useEffect(() => {
    reportFormik.values.vehicleReports?.forEach((vr, index) => {
      if (!vr) return;
      const list = vr.quantityUpdateTimes || [];
      const total = list.reduce(
        (sum: number, item: any) => sum + Number(item.quantity || 0),
        0,
      );

      // luôn cập nhật đúng
      reportFormik.setFieldValue(`vehicleReports[${index}].quantity`, total);
    });
  }, [reportFormik.values.vehicleReports]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          Mã thẻ lương: {initialValues?.assignedTo?.fullName} -{" "}
          {initialValues?.assignedTo?.salaryCode} - {initialValues?.job?.name}
        </Typography>

        {[
          JobTypeEnum.VEHICLE,
          JobTypeEnum.EXCAVATOR,
          JobTypeEnum.DOZER,
          JobTypeEnum.DRILL,
          JobTypeEnum.SERVICE_VEHICLE,
        ].includes(jobType ?? "") && (
          <Box>
            <Typography variant="h5">Báo chuyến/ sản lượng:</Typography>

            {reports.length > 0 ? (
              groupedReports.map((group) => {
                const deviceCode = group.device?.code || "(N/A)";
                const materialName = group.material?.name || "";
                const excCode = group.excavator?.code || "";
                const fromName = group.fromLocation?.name || "";
                const toName = group.toLocation?.name || "";

                const headerRight =
                  jobType === JobTypeEnum.EXCAVATOR
                    ? `Tổng số chuyến: ${group.totalQuantity || 0}`
                    : jobType === JobTypeEnum.VEHICLE
                      ? `Tổng số chuyến: ${group.totalQuantity || 0}`
                      : jobType === JobTypeEnum.SERVICE_VEHICLE
                        ? `Tổng chuyến: ${group.totalQuantity || 0} • Tổng km: ${group.totalDistanceKm || 0} • Tổng phút: ${
                            group.totalWorkingMinutes || 0
                          }`
                        : jobType === JobTypeEnum.DOZER
                          ? `Tổng phút: ${group.totalWorkingMinutes || 0}`
                          : "";

                return (
                  <Accordion key={group.key} disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Grid container alignItems="center">
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle1">
                            + Phương tiện: <b>{deviceCode}</b>
                          </Typography>
                          {jobType === JobTypeEnum.VEHICLE && excCode && (
                            <Typography variant="body2">
                              Từ máy xúc: {excCode} • Đến điểm: {toName}
                            </Typography>
                          )}
                          {jobType === JobTypeEnum.SERVICE_VEHICLE &&
                            (fromName || toName) && (
                              <Typography variant="body2">
                                {fromName ? `Từ điểm: ${fromName}` : ""}
                                {fromName && toName ? " • " : ""}
                                {toName ? `Đến điểm: ${toName}` : ""}
                              </Typography>
                            )}
                          {materialName && (
                            <Typography variant="body2">
                              Vật liệu: {materialName}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography align="right" variant="subtitle2">
                            {headerRight}
                          </Typography>
                        </Grid>
                      </Grid>
                    </AccordionSummary>

                    <AccordionDetails>
                      {group.children?.map(({ report, formIndex, history }) => (
                        <Box key={report._id} sx={{ mb: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography variant="h6">
                                {formIndex + 1}.Tạo lúc:{" "}
                                {report?.createdAt
                                  ? format(
                                      new Date(report.createdAt),
                                      "HH:mm dd/MM/yyyy",
                                    )
                                  : "—"}
                              </Typography>
                            </Grid>
                            {[
                              JobTypeEnum.DRILL,
                              JobTypeEnum.DOZER,
                              JobTypeEnum.VEHICLE,
                              JobTypeEnum.EXCAVATOR,
                              JobTypeEnum.SERVICE_VEHICLE,
                            ].includes(jobType) && (
                              <>
                                <Grid item xs={3}>
                                  <Typography>Vật liệu:</Typography>
                                </Grid>
                                <Grid item xs={9}>
                                  <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={materials}
                                    getOptionLabel={(option: Material) =>
                                      option.name || ""
                                    }
                                    value={
                                      materials.find(
                                        (p: any) =>
                                          p._id ===
                                          reportFormik.values.vehicleReports[
                                            formIndex
                                          ]?.material,
                                      ) || null
                                    }
                                    onChange={(event, newValue) => {
                                      reportFormik.setFieldValue(
                                        `vehicleReports[${formIndex}].material`,
                                        newValue?._id || "",
                                      );
                                    }}
                                    PopperComponent={StyledPopper}
                                    renderInput={(params) => (
                                      <TextField {...params} label="Vật liệu" />
                                    )}
                                  />
                                  {renderHistoryField(
                                    history,
                                    "material",
                                    null,
                                    "Vật liệu",
                                  )}
                                </Grid>
                              </>
                            )}
                            {/* KHOAN: drillDepth + hardnessF */}
                            {jobType === JobTypeEnum.DRILL && (
                              <>
                                <Grid item xs={3}>
                                  <Typography>Mét khoan sâu:</Typography>
                                </Grid>
                                <Grid item xs={9}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    size="small"
                                    name={`vehicleReports[${formIndex}].drillDepth`}
                                    value={
                                      reportFormik.values.vehicleReports[
                                        formIndex
                                      ]?.drillDepth || ""
                                    }
                                    onChange={reportFormik.handleChange}
                                  />
                                  {renderHistoryField(
                                    history,
                                    "drillDepth",
                                    null,
                                    "Mét khoan sâu",
                                  )}
                                </Grid>

                                <Grid item xs={3}>
                                  <Typography>Độ cứng:</Typography>
                                </Grid>
                                <Grid item xs={9}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    size="small"
                                    name={`vehicleReports[${formIndex}].hardnessF`}
                                    value={
                                      reportFormik.values.vehicleReports[
                                        formIndex
                                      ]?.hardnessF || ""
                                    }
                                    onChange={reportFormik.handleChange}
                                  />
                                  {renderHistoryField(
                                    history,
                                    "hardnessF",
                                    null,
                                    "Độ cứng",
                                  )}
                                </Grid>
                              </>
                            )}

                            {/* XE/XÚC/SERVICE: quantity */}
                            {[JobTypeEnum.SERVICE_VEHICLE].includes(
                              jobType,
                            ) && (
                              <>
                                <Grid item xs={3}>
                                  <Typography>Số chuyến:</Typography>
                                </Grid>
                                <Grid item xs={9}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    size="small"
                                    name={`vehicleReports[${formIndex}].quantity`}
                                    value={
                                      reportFormik.values.vehicleReports[
                                        formIndex
                                      ]?.quantity || ""
                                    }
                                    onChange={reportFormik.handleChange}
                                  />
                                  {renderHistoryField(
                                    history,
                                    "quantity",
                                    null,
                                    "Số chuyến",
                                  )}
                                </Grid>
                              </>
                            )}
                            {[
                              JobTypeEnum.VEHICLE,
                              JobTypeEnum.EXCAVATOR,
                            ].includes(jobType) && (
                              <>
                                <Grid item xs={3}>
                                  <Typography>Số chuyến:</Typography>
                                </Grid>
                                <Grid item xs={9}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                      const oldList =
                                        reportFormik.values.vehicleReports[
                                          formIndex
                                        ].quantityUpdateTimes || [];

                                      const newList = [
                                        ...oldList,
                                        { time: new Date(), quantity: 1 },
                                      ];

                                      reportFormik.setFieldValue(
                                        `vehicleReports[${formIndex}].quantityUpdateTimes`,
                                        newList,
                                      );
                                    }}
                                  >
                                    + Thêm chuyến
                                  </Button>
                                  {reportFormik.values.vehicleReports[
                                    formIndex
                                  ]?.quantityUpdateTimes?.map(
                                    (item: any, idx: number) => (
                                      <Box
                                        key={idx}
                                        display="flex"
                                        alignItems="center"
                                      >
                                        {/* HIỂN THỊ THỜI GIAN + HỆ SỐ */}
                                        <Typography
                                          sx={{ flexGrow: 1, fontSize: 14 }}
                                        >
                                          {item.time
                                            ? format(
                                                new Date(item.time),
                                                "dd-MM-yyyy HH:mm:ss",
                                              )
                                            : ""}{" "}
                                          - Hệ số: {item.quantity}
                                        </Typography>

                                        {/* NÚT XOÁ */}
                                        <IconButton
                                          color="error"
                                          onClick={() => {
                                            const list = [
                                              ...reportFormik.values
                                                .vehicleReports[formIndex]
                                                .quantityUpdateTimes,
                                            ];
                                            list.splice(idx, 1);
                                            reportFormik.setFieldValue(
                                              `vehicleReports[${formIndex}].quantityUpdateTimes`,
                                              list,
                                            );
                                          }}
                                        >
                                          <Close />
                                        </IconButton>
                                      </Box>
                                    ),
                                  )}
                                  {renderHistoryField(
                                    history,
                                    "quantity",
                                    null,
                                    "Chuyến",
                                  )}
                                </Grid>
                              </>
                            )}
                            {/* SERVICE: distanceKm + workingMinutes */}
                            {jobType === JobTypeEnum.SERVICE_VEHICLE && (
                              <>
                                <Grid item xs={3}>
                                  <Typography>Km di chuyển:</Typography>
                                </Grid>
                                <Grid item xs={9}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    size="small"
                                    name={`vehicleReports[${formIndex}].distanceKm`}
                                    value={
                                      reportFormik.values.vehicleReports[
                                        formIndex
                                      ]?.distanceKm || ""
                                    }
                                    onChange={reportFormik.handleChange}
                                  />
                                  {renderHistoryField(
                                    history,
                                    "distanceKm",
                                    null,
                                    "Km di chuyển",
                                  )}
                                </Grid>

                                <Grid item xs={3}>
                                  <Typography>Giờ sản phẩm (phút):</Typography>
                                </Grid>
                              </>
                            )}

                            {/* GẠT: workingMinutes */}
                            {(jobType === JobTypeEnum.DOZER ||
                              jobType === JobTypeEnum.SERVICE_VEHICLE) && (
                              <>
                                <Grid item xs={3}>
                                  <Typography>Giờ sản phẩm (phút):</Typography>
                                </Grid>
                                <Grid item xs={9}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    size="small"
                                    name={`vehicleReports[${formIndex}].workingMinutes`}
                                    value={
                                      reportFormik.values.vehicleReports[
                                        formIndex
                                      ]?.workingMinutes || ""
                                    }
                                    onChange={reportFormik.handleChange}
                                  />
                                  {history
                                    .filter((h: any) =>
                                      h.changes.some(
                                        (c: any) =>
                                          c.field === "workingMinutes",
                                      ),
                                    )
                                    .map((h: any, i: number) => {
                                      const changesText = h.changes
                                        .filter(
                                          (c: any) =>
                                            c.field === "workingMinutes",
                                        )
                                        .map(
                                          (c: any) =>
                                            `"${c.oldValue || ""}" → "${c.newValue || ""}"`,
                                        )
                                        .join(", ");
                                      return (
                                        <Typography
                                          key={i}
                                          variant="caption"
                                          color="secondary"
                                          display="block"
                                        >
                                          Nội dung: Giờ sản phẩm: {changesText},
                                          Thay đổi bởi: {h.changedBy?.username}{" "}
                                          {format(
                                            new Date(h.createdAt),
                                            "HH:mm dd/MM/yyyy",
                                          )}
                                        </Typography>
                                      );
                                    })}
                                  {renderHistoryField(
                                    history,
                                    "workingMinutes",
                                    null,
                                    "Giờ sản phẩm",
                                  )}
                                </Grid>
                              </>
                            )}
                          </Grid>
                        </Box>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                );
              })
            ) : (
              <Typography align="center">Chưa có dữ liệu</Typography>
            )}

            <Typography variant="h5" sx={{ mt: 2 }}>
              Tình trạng phương tiện:
            </Typography>
            {shiftReport?.vehicleSummaries?.map((item: any, index: number) => (
              <Box key={index}>
                <Grid container spacing={2} mb={2} key={index}>
                  <Grid item xs={3}>
                    <Typography variant="h6">+ Phương tiện:</Typography>
                  </Grid>
                  <Grid item xs={9}>
                    <Typography>{item.vehicle?.code}</Typography>
                  </Grid>

                  <Grid item xs={3}>
                    <Typography>Giờ sửa chữa:</Typography>
                  </Grid>
                  <Grid item xs={9}>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      name={`vehicleSummaries[${index}].repairHours`}
                      value={
                        shiftReportFormik.values.vehicleSummaries[index]
                          ?.repairHours || ""
                      }
                      onChange={shiftReportFormik.handleChange}
                    />
                    {renderHistoryField(
                      shiftReportHistories,
                      "repairHours",
                      index,
                      "Giờ sửa chữa",
                    )}
                  </Grid>
                  {!(
                    jobType === JobTypeEnum.EXCAVATOR ||
                    jobType === JobTypeEnum.DRILL ||
                    jobType === JobTypeEnum.DOZER
                  ) && (
                    <>
                      <Grid item xs={3}>
                        <Typography>Km hoạt động trên đồng hồ:</Typography>
                      </Grid>
                      <Grid item xs={9}>
                        <TextField
                          fullWidth
                          type="number"
                          size="small"
                          name={`vehicleSummaries[${index}].distanceKm`}
                          value={
                            shiftReportFormik.values.vehicleSummaries[index]
                              ?.distanceKm || ""
                          }
                          onChange={shiftReportFormik.handleChange}
                        />
                        {renderHistoryField(
                          shiftReportHistories,
                          "distanceKm",
                          index,
                          "Km hoạt động trên đồng hồ",
                        )}
                      </Grid>
                    </>
                  )}
                  {jobType === JobTypeEnum.EXCAVATOR ||
                  jobType === JobTypeEnum.DRILL ||
                  jobType === JobTypeEnum.DOZER ? (
                    <Grid item xs={3}>
                      <Typography>Giờ lũy kế trên đồng hồ:</Typography>
                    </Grid>
                  ) : (
                    <Grid item xs={3}>
                      <Typography>Giờ hoạt động trên đồng hồ:</Typography>
                    </Grid>
                  )}
                  <Grid item xs={9}>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      name={`vehicleSummaries[${index}].travelHours`}
                      value={
                        shiftReportFormik.values.vehicleSummaries[index]
                          ?.travelHours || ""
                      }
                      onChange={shiftReportFormik.handleChange}
                    />
                    {renderHistoryField(
                      shiftReportHistories,
                      "travelHours",
                      index,
                      "Giờ hoạt động trên đồng hồ",
                    )}
                  </Grid>

                  <Grid item xs={3}>
                    <Typography>Tồn dầu:</Typography>
                  </Grid>
                  <Grid item xs={9}>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      name={`vehicleSummaries[${index}].fuelRemain`}
                      value={
                        shiftReportFormik.values.vehicleSummaries[index]
                          ?.fuelRemain || ""
                      }
                      onChange={shiftReportFormik.handleChange}
                    />
                    {renderHistoryField(
                      shiftReportHistories,
                      "fuelRemain",
                      index,
                      "Tồn dầu",
                    )}
                  </Grid>

                  <Grid item xs={3}>
                    <Typography>Lĩnh trong ca:</Typography>
                  </Grid>
                  <Grid item xs={9}>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      name={`vehicleSummaries[${index}].fuelReceived`}
                      value={
                        shiftReportFormik.values.vehicleSummaries[index]
                          ?.fuelReceived || ""
                      }
                      onChange={shiftReportFormik.handleChange}
                    />
                    {renderHistoryField(
                      shiftReportHistories,
                      "fuelReceived",
                      index,
                      "Lĩnh trong ca",
                    )}
                  </Grid>

                  <Grid item xs={3}>
                    <Typography>Tồn cuối ca:</Typography>
                  </Grid>
                  <Grid item xs={9}>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      name={`vehicleSummaries[${index}].fuelRemainEnd`}
                      value={
                        shiftReportFormik.values.vehicleSummaries[index]
                          ?.fuelRemainEnd || ""
                      }
                      onChange={shiftReportFormik.handleChange}
                    />
                    {renderHistoryField(
                      shiftReportHistories,
                      "fuelRemainEnd",
                      index,
                      "Tồn cuối ca",
                    )}
                  </Grid>

                  <Grid item xs={3}>
                    <Typography>Tình trạng xe:</Typography>
                  </Grid>
                  <Grid item xs={9}>
                    <TextField
                      fullWidth
                      select
                      name={`vehicleSummaries[${index}].status`}
                      value={
                        shiftReportFormik.values.vehicleSummaries[index]
                          ?.status || ""
                      }
                      onChange={shiftReportFormik.handleChange}
                    >
                      <MenuItem value="fail">Hỏng</MenuItem>
                      <MenuItem value="good">Tốt</MenuItem>
                    </TextField>
                    {renderHistoryField(
                      shiftReportHistories,
                      "status",
                      index,
                      "Tình trạng xe",
                    )}
                  </Grid>
                </Grid>

                {shiftReportFormik.values.vehicleSummaries[index]?.status ===
                  "fail" && (
                  <Grid container spacing={2} mb={2} key={`${index}-reason`}>
                    <Grid item xs={3}>
                      <Typography>Lý do hỏng*:</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        name={`vehicleSummaries[${index}].note`}
                        value={
                          shiftReportFormik.values.vehicleSummaries[index]
                            ?.note || ""
                        }
                        onChange={shiftReportFormik.handleChange}
                      />
                      {renderHistoryField(
                        shiftReportHistories,
                        "note",
                        index,
                        "Lý do hỏng",
                      )}
                    </Grid>
                  </Grid>
                )}

                <Grid container spacing={2} mb={2} key={`${index}-gps`}>
                  <Grid item xs={3}>
                    <Typography>GPS:</Typography>
                  </Grid>
                  <Grid item xs={9}>
                    <TextField
                      fullWidth
                      select
                      name={`vehicleSummaries[${index}].gpsStatus`}
                      value={
                        shiftReportFormik.values.vehicleSummaries[index]
                          ?.gpsStatus || ""
                      }
                      onChange={shiftReportFormik.handleChange}
                    >
                      <MenuItem value="Hoạt động bình thường">
                        Hoạt động bình thường
                      </MenuItem>
                      <MenuItem value="Mất tín hiệu">Mất tín hiệu</MenuItem>
                    </TextField>
                    {renderHistoryField(
                      shiftReportHistories,
                      "gpsStatus",
                      index,
                      "GPS",
                    )}
                  </Grid>

                  <Grid item xs={3}>
                    <Typography>Kẹp chì/ niêm phong:</Typography>
                  </Grid>
                  <Grid item xs={9}>
                    <TextField
                      fullWidth
                      select
                      name={`vehicleSummaries[${index}].sealStatus`}
                      value={
                        shiftReportFormik.values.vehicleSummaries[index]
                          ?.sealStatus || ""
                      }
                      onChange={shiftReportFormik.handleChange}
                    >
                      <MenuItem value="Tốt">Tốt</MenuItem>
                      <MenuItem value="Hỏng">Hỏng</MenuItem>
                    </TextField>
                    {renderHistoryField(
                      shiftReportHistories,
                      "sealStatus",
                      index,
                      "kẹp chì/Niêm phong",
                    )}
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        )}
        {[JobTypeEnum.MAINTENANCE].includes(jobType ?? "") && (
          <Box>
            <Typography variant="h5" sx={{ mt: 2 }}>
              Tình trạng sửa chữa:
            </Typography>
            {shiftReport?.vehicleRepair?.map((item: any, index: number) => (
              <Box key={index}>
                <Grid container spacing={2} mb={2} key={index}>
                  <Grid item xs={3}>
                    <Typography variant="h6">+ Phương tiện:</Typography>
                  </Grid>
                  <Grid item xs={9}>
                    <Typography>{item.device?.code}</Typography>
                  </Grid>

                  <Grid item xs={3}>
                    <Typography>Trạng thái sửa chữa:</Typography>
                  </Grid>
                  <Grid item xs={9}>
                    <TextField
                      fullWidth
                      select
                      name={`vehicleRepair[${index}].status`}
                      value={
                        shiftReportFormik.values.vehicleRepair[index]?.status ||
                        ""
                      }
                      onChange={shiftReportFormik.handleChange}
                    >
                      <MenuItem value="Đã sửa xong">Đã sửa xong</MenuItem>
                      <MenuItem value="Chưa sửa xong">Chưa sửa xong</MenuItem>
                    </TextField>
                    {renderHistoryField(
                      shiftReportHistories,
                      "status",
                      index,
                      "Trạng thái sửa chữa",
                    )}
                  </Grid>
                </Grid>

                {shiftReportFormik.values.vehicleRepair[index]?.status ===
                  "Chưa sửa xong" && (
                  <Grid container spacing={2} mb={2} key={`${index}-reason`}>
                    <Grid item xs={3}>
                      <Typography>Tình trạng sửa chữa*:</Typography>
                    </Grid>
                    <Grid item xs={9}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        name={`vehicleRepair[${index}].noteRepair`}
                        value={
                          shiftReportFormik.values.vehicleRepair[index]
                            ?.noteRepair || ""
                        }
                        onChange={shiftReportFormik.handleChange}
                      />
                      {renderHistoryField(
                        shiftReportHistories,
                        "noteRepair",
                        index,
                        "Tình trạng sửa chữa",
                      )}
                    </Grid>
                  </Grid>
                )}
              </Box>
            ))}
          </Box>
        )}

        <Typography variant="h5">Khác:</Typography>
        <Box>
          <Grid container spacing={2}>
            {(jobType === JobTypeEnum.EXCAVATOR ||
              jobType === JobTypeEnum.DRILL ||
              jobType === JobTypeEnum.DOZER) && (
              <>
                <Grid item xs={3}>
                  <Typography>Giờ hoạt động trong ca:</Typography>
                </Grid>
                <Grid item xs={9}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    name="shiftHours"
                    value={shiftReportFormik.values.shiftHours || ""}
                    onChange={shiftReportFormik.handleChange}
                  />
                  {renderHistoryField(
                    shiftReportHistories,
                    "shiftHours",
                    null,
                    "Giờ hoạt động trong ca",
                  )}
                </Grid>
              </>
            )}
            <Grid item xs={3}>
              <Typography>Giờ bàn giao ca (phút):</Typography>
            </Grid>
            <Grid item xs={9}>
              <TextField
                fullWidth
                type="number"
                size="small"
                name="handoverHours"
                value={shiftReportFormik.values.handoverHours || ""}
                onChange={shiftReportFormik.handleChange}
              />
              {renderHistoryField(
                shiftReportHistories,
                "handoverHours",
                null,
                "Giờ bàn giao ca",
              )}
            </Grid>

            <Grid item xs={3}>
              <Typography>Nội dung bàn giao ca:</Typography>
            </Grid>
            <Grid item xs={9}>
              <TextField
                multiline
                rows={5}
                fullWidth
                size="small"
                name="handoverNotes"
                value={shiftReportFormik.values.handoverNotes || ""}
                onChange={shiftReportFormik.handleChange}
              />
              {renderHistoryField(
                shiftReportHistories,
                "handoverNotes",
                null,
                "Nội dung bàn giao ca",
              )}
            </Grid>

            <Grid item xs={3}>
              <Typography>Kiến nghị, rủi ro:</Typography>
            </Grid>
            <Grid item xs={9}>
              <TextField
                multiline
                rows={5}
                fullWidth
                size="small"
                name="risks"
                value={shiftReportFormik.values.risks || ""}
                onChange={shiftReportFormik.handleChange}
              />
              {renderHistoryField(
                shiftReportHistories,
                "risks",
                null,
                "Kiến nghị, rủi ro",
              )}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      {shiftReport && (
        <DialogActions>
          <Button onClick={handleClose}>Đóng</Button>
          {!isOver48Hours && (
            <Button variant="contained" onClick={handleUpdateAll}>
              Lưu lại
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
