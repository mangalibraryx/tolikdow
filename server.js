const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// TikTok Download API
app.post('/api/download', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url || !url.includes('tiktok.com')) {
            return res.status(400).json({ error: 'Invalid TikTok URL' });
        }
        
        // Method 1: Use TikTok API
        const videoData = await getTikTokVideo(url);
        
        if (videoData) {
            return res.json({
                success: true,
                ...videoData
            });
        }
        
        // Method 2: Alternative approach
        const alternativeData = await getAlternativeDownload(url);
        
        if (alternativeData) {
            return res.json({
                success: true,
                ...alternativeData
            });
        }
        
        throw new Error('Failed to fetch video');
        
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process video',
            message: error.message 
        });
    }
});

// TikTok video info endpoint
app.get('/api/video-info', async (req, res) => {
    const { url } = req.query;
    
    try {
        // Extract video ID
        const videoId = extractVideoId(url);
        
        if (!videoId) {
            return res.status(400).json({ error: 'Invalid video ID' });
        }
        
        // Fetch video info
        const response = await axios.get(`https://www.tiktok.com/oembed?url=https://www.tiktok.com/@tiktok/video/${videoId}`);
        
        res.json({
            success: true,
            data: response.data
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

// Direct download endpoint
app.get('/api/direct-download', async (req, res) => {
    const { url, quality = 'hd' } = req.query;
    
    try {
        // Fetch the video
        const videoUrl = await getDirectVideoUrl(url, quality);
        
        if (videoUrl) {
            // Redirect to video
            res.redirect(videoUrl);
        } else {
            res.status(404).json({ error: 'Video not found' });
        }
        
    } catch (error) {
        res.status(500).json({ error: 'Download failed' });
    }
});

// Helper functions
async function getTikTokVideo(url) {
    try {
        // Using a public TikTok API
        const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('TikTok API error:', error.message);
        return null;
    }
}

async function getAlternativeDownload(url) {
    try {
        // Alternative API
        const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        
        if (response.data.code === 0) {
            return {
                title: response.data.data.title,
                author: response.data.data.author,
                thumbnail: response.data.data.cover,
                hd: response.data.data.play,
                watermarked: response.data.data.wmplay,
                audio: response.data.data.music
            };
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

async function getDirectVideoUrl(url, quality) {
    // This would require web scraping or using various APIs
    // For now, return a proxy URL
    return `https://cors-proxy.example.com/?url=${encodeURIComponent(url)}&quality=${quality}`;
}

function extractVideoId(url) {
    const regex = /\/video\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Open http://localhost:${port} in your browser`);
});
