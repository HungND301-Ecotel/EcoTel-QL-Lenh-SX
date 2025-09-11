// useResizableColumns.ts
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useRef, useState } from 'react';

export function useResizableColumns<T>(
    columns: ColumnsType<T>,
    deps: any[] = []
) {
    // Lưu width theo key để khi hide/show vẫn khôi phục đúng cột
    const widthsRef = useRef<Record<string, number>>({});

    const [cols, setCols] = useState(columns);

    useEffect(() => {
        // mỗi lần columns (hoặc deps) đổi, sync lại và áp width đã lưu
        setCols(columns.map((c: any) => ({
            ...c,
            width: widthsRef.current[String(c.key)] ?? c.width,
        })));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns, ...deps]);

    const handleResize =
        (key: React.Key) =>
            (_: any, { size }: { size: { width: number } }) => {
                const k = String(key);
                widthsRef.current[k] = size.width;
                setCols(prev =>
                    prev.map((c: any) =>
                        String(c.key) === k ? { ...c, width: size.width } : c
                    )
                );
            };

    const mergedColumns = cols.map((col: any) => ({
        ...col,
        onHeaderCell: (column: any) => ({
            width: column.width,
            onResize: handleResize(col.key), // <-- bind theo key
        }),
    }));

    return { mergedColumns };
}
