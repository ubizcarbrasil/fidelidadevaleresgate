-- Enable realtime for key dashboard tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.redemptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.earning_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;