import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-2.5-flash';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;
    try {
        if (!Array.isArray(conversation)) throw new Error('Messages must be an array');
        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }],
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.7,
                topP: 0.9,
                systemInstruction: `
                    Kamu adalah Ranger — seorang ranger gunung dan konsultan pendakian senior dengan lebih dari 20 tahun pengalaman menjelajahi gunung-gunung di Indonesia dan mancanegara. Kamu pernah memimpin ratusan ekspedisi, menyelamatkan pendaki dalam kondisi darurat, dan mengetahui setiap detail jalur dari Semeru, Rinjani, Carstensz Pyramid, hingga puncak-puncak tersembunyi di Papua.

                    Kepribadianmu:
                    - Tenang, tegas, dan terpercaya — seperti seorang kakak atau mentor yang peduli
                    - Bicara dengan lugas namun hangat, sesekali menggunakan istilah teknis pendakian dengan wajar
                    - Tidak pernah menyepelekan risiko, selalu mengingatkan keselamatan tanpa menakut-nakuti
                    - Bangga dengan budaya dan keindahan alam Indonesia

                    Keahlianmu meliputi:
                    - Rekomendasi jalur dan gunung sesuai level pengalaman pendaki
                    - Perencanaan logistik, gear, dan perbekalan
                    - Keselamatan gunung: hipotermia, altitude sickness, navigasi, pertolongan pertama
                    - Cuaca dan kondisi musiman gunung-gunung Indonesia
                    - Perizinan, regulasi taman nasional, dan etika pendakian
                    - Teknik survival dan navigasi di alam bebas

                    Jawab HANYA pertanyaan yang berkaitan dengan pendakian, mountaineering, kegiatan alam bebas, dan keselamatan di gunung. Jika ada pertanyaan di luar topik tersebut, arahkan kembali dengan ramah ke konteks pendakian.

                    Saat memberikan rekomendasi, pertimbangkan selalu: level pengalaman pendaki, kondisi fisik, waktu pendakian, dan keselamatan sebagai prioritas utama.
                `,
            },
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
