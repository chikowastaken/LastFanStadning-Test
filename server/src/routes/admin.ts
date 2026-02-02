import { Router, Response } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { strictRateLimit } from '../middleware/rateLimit';

const router = Router();

// All admin routes require admin authentication
router.use(requireAdmin);

// ============ QUIZZES ============

// GET /api/admin/quizzes
router.get('/quizzes', async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .select('id, title, description, day_number, start_at, end_at, is_locked, quiz_type')
      .eq('quiz_type', 'daily')
      .order('day_number', { ascending: false });

    if (error) throw error;
    res.json({ quizzes: data || [] });
  } catch (error: any) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch quizzes' });
  }
});

// POST /api/admin/quizzes
router.post('/quizzes', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, day_number, start_at, end_at, is_locked } = req.body;

    if (!title || !start_at || !end_at) {
      return res.status(400).json({ error: 'Title, start_at, and end_at are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        day_number: Number(day_number),
        start_at,
        end_at,
        is_locked: Boolean(is_locked),
        quiz_type: 'daily',
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ quiz: data });
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: error.message || 'Failed to create quiz' });
  }
});

// PUT /api/admin/quizzes/:id
router.put('/quizzes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, day_number, start_at, end_at, is_locked } = req.body;

    if (!title || !start_at || !end_at) {
      return res.status(400).json({ error: 'Title, start_at, and end_at are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        day_number: Number(day_number),
        start_at,
        end_at,
        is_locked: Boolean(is_locked),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ quiz: data });
  } catch (error: any) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: error.message || 'Failed to update quiz' });
  }
});

// DELETE /api/admin/quizzes/:id
router.delete('/quizzes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('quizzes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: error.message || 'Failed to delete quiz' });
  }
});

// PATCH /api/admin/quizzes/:id/lock
router.patch('/quizzes/:id/lock', strictRateLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_locked } = req.body;

    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .update({ is_locked: Boolean(is_locked) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ quiz: data });
  } catch (error: any) {
    console.error('Error toggling quiz lock:', error);
    res.status(500).json({ error: error.message || 'Failed to toggle lock' });
  }
});

// ============ QUESTIONS ============

// GET /api/admin/questions/:quizId
router.get('/questions/:quizId', async (req: AuthRequest, res: Response) => {
  try {
    const { quizId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('questions')
      .select('id, quiz_id, question_text, question_type, options, correct_answer, points, order_index')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    res.json({ questions: data || [] });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch questions' });
  }
});

// POST /api/admin/questions
router.post('/questions', async (req: AuthRequest, res: Response) => {
  try {
    const { quiz_id, question_text, question_type, options, correct_answer, points, order_index } = req.body;

    if (!quiz_id || !question_text || !correct_answer) {
      return res.status(400).json({ error: 'quiz_id, question_text, and correct_answer are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert({
        quiz_id,
        question_text: question_text.trim(),
        question_type: question_type || 'text_input',
        options: options || null,
        correct_answer: correct_answer.trim(),
        points: Number(points) || 10,
        order_index: Number(order_index) || 0,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ question: data });
  } catch (error: any) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: error.message || 'Failed to create question' });
  }
});

// PUT /api/admin/questions/:id
router.put('/questions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { question_text, question_type, options, correct_answer, points, order_index } = req.body;

    if (!question_text || !correct_answer) {
      return res.status(400).json({ error: 'question_text and correct_answer are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('questions')
      .update({
        question_text: question_text.trim(),
        question_type: question_type || 'text_input',
        options: options || null,
        correct_answer: correct_answer.trim(),
        points: Number(points) || 10,
        order_index: Number(order_index) || 0,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ question: data });
  } catch (error: any) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: error.message || 'Failed to update question' });
  }
});

// DELETE /api/admin/questions/:id
router.delete('/questions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: error.message || 'Failed to delete question' });
  }
});

// ============ TOURNAMENTS ============

// GET /api/admin/tournaments
router.get('/tournaments', async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('quiz_type', 'tournament')
      .order('tournament_starts_at', { ascending: false });

    if (error) throw error;
    res.json({ tournaments: data || [] });
  } catch (error: any) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tournaments' });
  }
});

// POST /api/admin/tournaments
router.post('/tournaments', strictRateLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, day_number, tournament_prize_gel, registration_opens_at, registration_closes_at, tournament_starts_at, tournament_ends_at } = req.body;

    if (!title || !tournament_starts_at || !tournament_ends_at || day_number === undefined || day_number === null) {
      return res.status(400).json({ error: 'Title, day_number, tournament_starts_at, and tournament_ends_at are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        day_number: Number(day_number),
        tournament_prize_gel: tournament_prize_gel ? Number(tournament_prize_gel) : null,
        registration_opens_at: registration_opens_at || null,
        registration_closes_at: registration_closes_at || null,
        tournament_starts_at,
        tournament_ends_at,
        quiz_type: 'tournament',
        start_at: tournament_starts_at, // Required field
        end_at: tournament_ends_at, // Required field
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ tournament: data });
  } catch (error: any) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: error.message || 'Failed to create tournament' });
  }
});

// PUT /api/admin/tournaments/:id
router.put('/tournaments/:id', strictRateLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, day_number, tournament_prize_gel, registration_opens_at, registration_closes_at, tournament_starts_at, tournament_ends_at } = req.body;

    if (!title || !tournament_starts_at || !tournament_ends_at || day_number === undefined || day_number === null) {
      return res.status(400).json({ error: 'Title, day_number, tournament_starts_at, and tournament_ends_at are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('quizzes')
      .update({
        title: title.trim(),
        description: description?.trim() || null,
        day_number: Number(day_number),
        tournament_prize_gel: tournament_prize_gel ? Number(tournament_prize_gel) : null,
        registration_opens_at: registration_opens_at || null,
        registration_closes_at: registration_closes_at || null,
        tournament_starts_at,
        tournament_ends_at,
        start_at: tournament_starts_at,
        end_at: tournament_ends_at,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ tournament: data });
  } catch (error: any) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ error: error.message || 'Failed to update tournament' });
  }
});

// DELETE /api/admin/tournaments/:id
router.delete('/tournaments/:id', strictRateLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('quizzes')
      .delete()
      .eq('id', id)
      .eq('quiz_type', 'tournament');

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: error.message || 'Failed to delete tournament' });
  }
});

export default router;

