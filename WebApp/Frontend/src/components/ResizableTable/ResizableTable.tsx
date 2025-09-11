import React, { useState } from 'react';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface ResizableTitleProps {
    onResize: (e: React.SyntheticEvent, data: { size: { width: number } }) => void;
    width: number;
    children: React.ReactNode;
}

const ResizableTitle = (props: ResizableTitleProps & React.HTMLAttributes<HTMLTableCellElement>) => {
    const { onResize, width, children, ...restProps } = props;

    if (!width) {
        return <th {...restProps}>{children}</th>;
    }

    return (
        <Resizable
            width={width}
            height={0}
            handle={
                <span
                    className="react-resizable-handle"
                    onClick={(e) => e.stopPropagation()}
                />
            }
            onResize={onResize}
            draggableOpts={{ enableUserSelectHack: false }}
        >
            <th {...restProps}>{children}</th>
        </Resizable>
    );
};
export default ResizableTitle; 