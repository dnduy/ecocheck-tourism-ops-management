<?php

namespace App\Exports;

use App\Models\Run;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ChecklistExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $run;

    public function __construct(Run $run)
    {
        $this->run = $run;
    }

    public function collection()
    {
        return $this->run->entries()->with('item.group')->get();
    }

    public function map($entry): array
    {
        return [
            $entry->item->group->title ?? 'N/A',
            $entry->item->title ?? 'N/A',
            $entry->value,
            $entry->note,
            $entry->updated_at->format('d/m/Y H:i'),
        ];
    }

    public function headings(): array
    {
        return [
            'Nhóm',
            'Hạng mục',
            'Kết quả',
            'Ghi chú',
            'Thời gian',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the first row as bold text
            1 => ['font' => ['bold' => true]],
        ];
    }
}
