-- Add idXeBus column to TUYENDUONG table
USE CNPM;
GO

-- Check if column exists before adding
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TUYENDUONG') AND name = 'idXeBus')
BEGIN
    ALTER TABLE dbo.TUYENDUONG
    ADD idXeBus INT NULL;
    
    ALTER TABLE dbo.TUYENDUONG
    ADD CONSTRAINT FK_TUYEN_XEBUS FOREIGN KEY(idXeBus) REFERENCES dbo.XEBUS(idXe);
END
GO
