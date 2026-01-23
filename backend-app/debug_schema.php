<?php

use Illuminate\Support\Facades\DB;

function step($msg)
{
    echo "\n[STEP] $msg\n";
}

// Inspect Schema
step("Inspecting 'template_sessions'...");
print_r(DB::select('DESCRIBE template_sessions'));


