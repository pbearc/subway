"""Initial migration

Revision ID: 1f442ba6bb81
Revises: 
Create Date: 2025-03-17 20:54:23.332730

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '1f442ba6bb81'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('operating_hours', 'opening_time',
               existing_type=postgresql.TIME(),
               type_=sa.String(length=10),
               existing_nullable=True)
    op.alter_column('operating_hours', 'closing_time',
               existing_type=postgresql.TIME(),
               type_=sa.String(length=10),
               existing_nullable=True)
    op.alter_column('operating_hours', 'created_at',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               type_=sa.DateTime(),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('operating_hours', 'updated_at',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               type_=sa.DateTime(),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.drop_index('idx_operating_hours_outlet_id', table_name='operating_hours')
    op.drop_constraint('operating_hours_outlet_id_day_of_week_key', 'operating_hours', type_='unique')
    op.drop_constraint('operating_hours_outlet_id_fkey', 'operating_hours', type_='foreignkey')
    op.create_foreign_key(None, 'operating_hours', 'outlets', ['outlet_id'], ['id'])
    op.alter_column('outlets', 'name',
               existing_type=sa.VARCHAR(length=100),
               type_=sa.String(length=255),
               existing_nullable=False)
    op.alter_column('outlets', 'waze_link',
               existing_type=sa.TEXT(),
               type_=sa.String(length=500),
               existing_nullable=True)
    op.alter_column('outlets', 'latitude',
               existing_type=sa.NUMERIC(precision=10, scale=8),
               type_=sa.Float(),
               existing_nullable=True)
    op.alter_column('outlets', 'longitude',
               existing_type=sa.NUMERIC(precision=11, scale=8),
               type_=sa.Float(),
               existing_nullable=True)
    op.alter_column('outlets', 'created_at',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               type_=sa.DateTime(),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('outlets', 'updated_at',
               existing_type=postgresql.TIMESTAMP(timezone=True),
               type_=sa.DateTime(),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('outlets', 'updated_at',
               existing_type=sa.DateTime(),
               type_=postgresql.TIMESTAMP(timezone=True),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('outlets', 'created_at',
               existing_type=sa.DateTime(),
               type_=postgresql.TIMESTAMP(timezone=True),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('outlets', 'longitude',
               existing_type=sa.Float(),
               type_=sa.NUMERIC(precision=11, scale=8),
               existing_nullable=True)
    op.alter_column('outlets', 'latitude',
               existing_type=sa.Float(),
               type_=sa.NUMERIC(precision=10, scale=8),
               existing_nullable=True)
    op.alter_column('outlets', 'waze_link',
               existing_type=sa.String(length=500),
               type_=sa.TEXT(),
               existing_nullable=True)
    op.alter_column('outlets', 'name',
               existing_type=sa.String(length=255),
               type_=sa.VARCHAR(length=100),
               existing_nullable=False)
    op.drop_constraint(None, 'operating_hours', type_='foreignkey')
    op.create_foreign_key('operating_hours_outlet_id_fkey', 'operating_hours', 'outlets', ['outlet_id'], ['id'], ondelete='CASCADE')
    op.create_unique_constraint('operating_hours_outlet_id_day_of_week_key', 'operating_hours', ['outlet_id', 'day_of_week'])
    op.create_index('idx_operating_hours_outlet_id', 'operating_hours', ['outlet_id'], unique=False)
    op.alter_column('operating_hours', 'updated_at',
               existing_type=sa.DateTime(),
               type_=postgresql.TIMESTAMP(timezone=True),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('operating_hours', 'created_at',
               existing_type=sa.DateTime(),
               type_=postgresql.TIMESTAMP(timezone=True),
               existing_nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    op.alter_column('operating_hours', 'closing_time',
               existing_type=sa.String(length=10),
               type_=postgresql.TIME(),
               existing_nullable=True)
    op.alter_column('operating_hours', 'opening_time',
               existing_type=sa.String(length=10),
               type_=postgresql.TIME(),
               existing_nullable=True)
    # ### end Alembic commands ###
