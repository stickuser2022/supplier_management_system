# scripts/backup.ps1
# 每日备份 dev.db + storage/ 到云盘同步目录
# 用法示例:
#   .\scripts\backup.ps1 -DestinationRoot "C:\Users\你的用户名\阿里云盘\qingger-backups"

param(
    [Parameter(Mandatory=$true)]
    [string]$DestinationRoot,

    [int]$KeepDays = 7
)

$ErrorActionPreference = "Stop"

# 项目根目录 = 脚本所在目录的父目录
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DbPath = Join-Path $ProjectRoot "dev.db"
$StorageDir = Join-Path $ProjectRoot "storage"

$Today = Get-Date -Format "yyyy-MM-dd"
$SnapshotDir = Join-Path $DestinationRoot $Today
$LogPath = Join-Path $DestinationRoot "backup.log"

function Write-Log {
    param([string]$Message)
    $Stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Line = "$Stamp  $Message"
    Write-Host $Line
    Add-Content -Path $LogPath -Value $Line -Encoding UTF8
}

try {
    if (-not (Test-Path $DestinationRoot)) {
        New-Item -ItemType Directory -Path $DestinationRoot -Force | Out-Null
    }

    Write-Log "=== 开始备份 ==="

    # 1. 建今日快照目录(已存在则覆盖)
    if (Test-Path $SnapshotDir) {
        Remove-Item $SnapshotDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $SnapshotDir | Out-Null

    # 2. 备份 dev.db(简单 copy 即可;低并发场景不需要 SQLite online backup)
    if (Test-Path $DbPath) {
        Copy-Item $DbPath -Destination (Join-Path $SnapshotDir "dev.db")
        Write-Log "OK  dev.db 已备份"
    } else {
        Write-Log "WARN  dev.db 不存在,跳过"
    }

    # 3. 镜像 storage/
    if (Test-Path $StorageDir) {
        $StorageDest = Join-Path $SnapshotDir "storage"
        robocopy $StorageDir $StorageDest /MIR /NJH /NJS /NDL /NP /R:2 /W:5 | Out-Null
        # robocopy 退出码 0-7 都算正常(0=没变化, 1-7=有文件复制/同步),8+ 才是真错误
        if ($LASTEXITCODE -ge 8) {
            throw "robocopy 失败,退出码 $LASTEXITCODE"
        }
        Write-Log "OK  storage/ 已备份"
    } else {
        Write-Log "WARN  storage/ 不存在,跳过"
    }

    # 4. 清理 N 天前的旧快照
    $Cutoff = (Get-Date).AddDays(-$KeepDays)
    $OldSnapshots = Get-ChildItem $DestinationRoot -Directory |
        Where-Object {
            $_.Name -match '^\d{4}-\d{2}-\d{2}$' -and
            [DateTime]::ParseExact($_.Name, 'yyyy-MM-dd', $null) -lt $Cutoff
        }
    foreach ($Old in $OldSnapshots) {
        Remove-Item $Old.FullName -Recurse -Force
        Write-Log "CLEAN  清理旧快照: $($Old.Name)"
    }

    Write-Log "=== 备份完成 ==="
    exit 0
}
catch {
    Write-Log "ERROR  备份失败: $_"
    exit 1
}