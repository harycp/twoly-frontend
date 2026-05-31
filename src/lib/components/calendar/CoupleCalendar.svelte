<script lang="ts">
    import type { CalendarEvent } from '$lib/services/calendar.service';

    interface Props {
        events: CalendarEvent[];
        selectedDate: Date;
        currentMonthDate: Date;
        onSelectDate: (date: Date) => void;
        onChangeMonth: (newDate: Date) => void;
    }

    let { events, selectedDate = $bindable(), currentMonthDate = $bindable(), onSelectDate, onChangeMonth }: Props = $props();

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    let calendarDays = $derived.by(() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        let days = [];
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }
        return days;
    });

    function getEventsForDate(date: Date) {
        return events.filter(e => {
            const ed = new Date(e.event_date);
            return ed.getDate() === date.getDate() && ed.getMonth() === date.getMonth() && ed.getFullYear() === date.getFullYear();
        });
    }

    function isSameDay(d1: Date, d2: Date) {
        return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
    }

    function nextMonth() {
        onChangeMonth(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
    }

    function prevMonth() {
        onChangeMonth(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
    }
</script>

<div class="w-full rounded-[36px] bg-white/60 backdrop-blur-xl border border-white p-6 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)]">
    
    <!-- HEADER KALENDER -->
    <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-black text-gray-900 tracking-tight">
            {monthNames[currentMonthDate.getMonth()]} <span class="text-gray-400 font-bold">{currentMonthDate.getFullYear()}</span>
        </h2>
        <div class="flex gap-2">
            <button onclick={prevMonth} aria-label="Previous month" class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-gray-600 hover:bg-gray-50 active:scale-90 transition-all">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button onclick={nextMonth} aria-label="Next month" class="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-gray-600 hover:bg-gray-50 active:scale-90 transition-all">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </button>
        </div>
    </div>

    <!-- GRID HARI -->
    <div class="grid grid-cols-7 gap-y-4 gap-x-1">
        <!-- ESLint Key fix: (day) -->
        {#each daysOfWeek as day (day)}
            <div class="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                {day}
            </div>
        {/each}

        <!-- ESLint Key fix: (day.date.toISOString()) -->
        {#each calendarDays as day (day.date.toISOString())}
            {@const dayEvents = getEventsForDate(day.date)}
            {@const isSelected = isSameDay(day.date, selectedDate)}
            {@const isToday = isSameDay(day.date, new Date())}
            
            <div class="relative flex justify-center group z-10 hover:z-50">
                <!-- Tombol HANYA memiliki fungsi onclick. Tooltip diatur oleh class "group" di atasnya -->
                <button 
                    type="button"
                    onclick={() => onSelectDate(day.date)}
                    class="relative flex h-12 w-12 flex-col items-center justify-center rounded-full transition-all duration-300 active:scale-90 {isSelected ? 'bg-gray-900 text-white shadow-md scale-105' : day.isCurrentMonth ? 'text-gray-800 hover:bg-gray-100/50' : 'text-gray-300 opacity-50'}"
                >
                    <!-- Indikator Hari Ini (Lingkaran tipis) -->
                    {#if isToday && !isSelected}
                        <div class="absolute inset-0 rounded-full border-2 border-[#FDA4AF]/50"></div>
                    {/if}

                    <span class="text-[15px] font-bold z-10 {isToday && !isSelected ? 'text-[#FDA4AF]' : ''}">
                        {day.date.getDate()}
                    </span>
                    
                    <!-- HEATMAP / INDICATOR DOTS -->
                    {#if dayEvents.length > 0}
                            <div class="absolute bottom-1.5 flex w-full justify-center gap-0.75 z-10">
                            <!-- ESLint Key fix: (ev.id) -->
                            {#each dayEvents.slice(0, 3) as ev (ev.id)}
                                <div class="h-1.5 w-1.5 rounded-full shadow-sm
                                    {ev.event_type === 'memory' ? 'bg-[#FDA4AF]' : 
                                     ev.event_type === 'date_plan' ? 'bg-[#EA580C]' : 
                                     ev.event_type === 'anniversary' ? 'bg-[#8B5CF6]' : 'bg-blue-400'}">
                                </div>
                            {/each}
                        </div>
                    {/if}
                </button>

                <!-- TOOLTIP POPOVER CANGGIH: Muncul murni karena group-hover CSS, tanpa memicu event JS -->
                {#if dayEvents.length > 0}
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-45 pointer-events-none opacity-0 scale-95 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:scale-100 group-hover:-translate-y-1 flex flex-col items-center drop-shadow-xl z-50">
                        <div class="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl p-3 shadow-lg space-y-2 min-w-32.5">
                            <!-- ESLint Key fix: (ev.id) -->
                            {#each dayEvents.slice(0, 4) as ev (ev.id)}
                                <div class="flex items-start gap-2 text-left">
                                    <div class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full
                                        {ev.event_type === 'memory' ? 'bg-[#FDA4AF]' : 
                                        ev.event_type === 'date_plan' ? 'bg-[#EA580C]' : 
                                        ev.event_type === 'anniversary' ? 'bg-[#8B5CF6]' : 'bg-blue-400'}">
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-[12px] font-bold text-white truncate max-w-35 leading-tight">{ev.title}</span>
                                    </div>
                                </div>
                            {/each}
                            {#if dayEvents.length > 4}
                                <div class="text-[10px] text-gray-400 font-bold pl-3.5 pt-0.5">+{dayEvents.length - 4} more</div>
                            {/if}
                        </div>
                        <!-- Panah kecil di bawah tooltip -->
                        <div class="w-3 h-3 bg-gray-900/95 rotate-45 -mt-1.5 border-r border-b border-gray-700"></div>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
</div>