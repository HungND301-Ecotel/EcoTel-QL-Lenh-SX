// src/ui/poppers.tsx
import { styled } from '@mui/material/styles';
import Popper from '@mui/material/Popper';

export const StyledPopper = styled(Popper)({
    '& .MuiAutocomplete-listbox': {
        maxHeight: '200px',
        overflowY: 'auto',
    },
});
