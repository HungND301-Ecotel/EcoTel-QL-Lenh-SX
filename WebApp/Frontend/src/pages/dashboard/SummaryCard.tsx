import { Box, Card, Typography } from '@mui/material';
import React from 'react'
import { useNavigate } from 'react-router-dom';

export default function SummaryCard(
    {
        title,
        value,
        icon,
        color,
        type
    }: {
        title: string;
        value: number;
        icon: React.ReactNode;
        color: string;
        type: string;
    }
) {
    const navigate = useNavigate();
    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                },
            }}
        >
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', cursor: 'pointer' }} gutterBottom
                    onClick={() => { navigate(`${type === "department" ? '/departments' : '/users'}`) }}>
                    {title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {value}
                </Typography>
            </Box>
            <Box
                sx={{
                    width: 60,
                    height: 60,
                    bgcolor: color,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                }}
            >
                {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 32 } })}
            </Box>
        </Card>
    )
}