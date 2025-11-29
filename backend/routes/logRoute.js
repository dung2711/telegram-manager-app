import express from 'express';
import { getMyLogs } from '../controllers/logController.js';

const router = express.Router();


// Route xem danh sách 
router.get('/', async (req, res) => {
    try {
        const { accountID, ...filters } = req.query;
        
        const result = await getMyLogs(accountID, filters);
        res.status(200).json(result);
    } catch (error) {

        res.status(500).json(error);
    }
});

export default router;