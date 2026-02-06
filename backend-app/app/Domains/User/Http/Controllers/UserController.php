<?php

namespace App\Domains\User\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UserController
{
    public function index()
    {
        $users = User::with('roles')->get();
        return response()->json($users->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->getRoleNames()->first(),
        ]));
    }

    public function show(int $id)
    {
        $user = User::with('roles')->findOrFail($id);
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->getRoleNames()->first(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email|max:255',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['staff', 'supervisor', 'manager', 'admin'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);
        Role::findOrCreate($validated['role'], 'sanctum');
        $user->syncRoles([$validated['role']]);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->getRoleNames()->first(),
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($id)
            ],
            'password' => 'sometimes|string|min:8',
            'role' => ['sometimes', Rule::in(['staff', 'supervisor', 'manager', 'admin'])],
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }
        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }
        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
        if (isset($validated['role'])) {
            Role::findOrCreate($validated['role'], 'sanctum');
            $user->syncRoles([$validated['role']]);
        }

        $user->save();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->getRoleNames()->first(),
        ]);
    }

    public function destroy(int $id)
    {
        $user = User::findOrFail($id);

        // Prevent deleting yourself
        if (auth()->id() === $user->id) {
            return response()->json([
                'message' => 'Không thể xóa tài khoản của chính mình'
            ], 403);
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($user) {
            // Note: In strict mode, we might want to fail if user has dependencies.
            // As this is a P0 fix, we stick to standard delete but transactionally safe.
            // Future work: detach/nullify relationships if ON DELETE CASCADE is missing.

            $user->delete();
            return response()->json(null, 204);
        });
    }
}
