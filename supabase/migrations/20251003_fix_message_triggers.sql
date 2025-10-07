-- Fix update_conversation_last_message function to use correct fields
-- The function was referencing NEW.sender and last_human_message_at which don't exist
-- Simplified to only update last_message_at

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;
