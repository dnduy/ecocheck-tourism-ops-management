<?php

namespace App\Domains\User\Http\Controllers;

use App\Domains\User\Models\User;
use Illuminate\Http\Request;

class UserController
{
    public function index()
    {
        $users = User::select('id', 'name', 'email', 'role')->get();
        return response()->json($users);
    }

    public function show(int $id)
    {
        $user = User::findOrFail($id);
        return response()->json($user->only(['id', 'name', 'email', 'role']));
    }
}
