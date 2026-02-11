// src/integrations/supabase/client.ts (또는 유사한 경로의 파일)

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 기존의 자동 로드 로직을 지우고 아래 내용을 직접 넣으세요
const supabaseUrl = 'https://yhvbgxdmhupbmkkqwzpm.supabase.co';
const supabaseAnonKey = 'sb_publishable_c0bv1TFTtwCAQSUsmQmpaQ_Q1e2t5r_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);